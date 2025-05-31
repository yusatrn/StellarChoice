"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as freighterApi from '@stellar/freighter-api';

interface WalletContextType {
  isConnected: boolean;
  publicKey: string | null;
  network: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children?: React.ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet connection
  useEffect(() => {
    const init = async () => {
      console.log('Initializing wallet connection...');
      setIsLoading(true);
      try {
        const isFreighterAvailable = await freighterApi.isConnected().catch(() => false);
        console.log('Freighter available:', isFreighterAvailable);
        
        if (isFreighterAvailable) {
          const connected = await freighterApi.isConnected();
          console.log('Freighter connected:', connected);
          
          if (connected) {
            console.log('Getting account info...');
            const result = await getAccountInfo();
            console.log('Account info loaded:', { 
              isConnected: result.isConnected, 
              publicKey: result.publicKey ? '***' + result.publicKey.slice(-4) : null,
              network: result.network 
            });
          } else {
            console.log('Freighter is not connected, user needs to connect manually');
            setIsConnected(false);
            setPublicKey(null);
            setNetwork(null);
          }
        } else {
          console.log('Freighter extension not detected');
          setError('Freighter uzantısı bulunamadı. Lütfen Freighter cüzdanını yükleyin.');
          setIsConnected(false);
          setPublicKey(null);
          setNetwork(null);
        }
      } catch (err) {
        console.error('Error initializing wallet:', err);
        setError('Cüzdan bağlantısı başlatılırken hata oluştu');
      } finally {
        console.log('Finished initializing wallet connection');
        setIsLoading(false);
      }
    };

    init();
    
    // Set up event listeners for account changes
    const handleAccountChange = () => {
      console.log('Account changed, refreshing wallet info...');
      getAccountInfo().catch(console.error);
    };
    
    // Listen for account changes
    window.addEventListener('accountChanged', handleAccountChange);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('accountChanged', handleAccountChange);
    };
  }, []);

  const getAccountInfo = async () => {
    try {
      const addressResponse = await freighterApi.getAddress();
      const publicKey = typeof addressResponse === 'string' 
        ? addressResponse 
        : (addressResponse as any)?.address || null;
      
      const networkResponse = await freighterApi.getNetwork();
      const network = typeof networkResponse === 'string' 
        ? networkResponse 
        : (networkResponse as any)?.network || null;
      
      // Only set connected to true if we have a valid public key
      const isConnected = !!publicKey;
      
      setPublicKey(publicKey);
      setNetwork(network);
      setIsConnected(isConnected);
      setError(isConnected ? null : 'Geçeriz cüzdan adresi alındı');
      
      return { publicKey, network, isConnected };
    } catch (err) {
      console.error('Error getting account info:', err);
      setError('Hesap bilgileri alınamadı');
      setIsConnected(false);
      setPublicKey(null);
      setNetwork(null);
      throw err;
    }
  };

  const connect = async () => {
    console.log('Connecting wallet...');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Requesting access to Freighter...');
      await freighterApi.requestAccess();
      console.log('Access granted, getting account info...');
      await getAccountInfo();
      console.log('Wallet connected successfully');
    } catch (err) {
      console.error('Error connecting wallet:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Cüzdana bağlanılamadı: ${errorMessage}. Lütfen tekrar deneyin.`);
      setIsConnected(false);
      setPublicKey(null);
      setNetwork(null);
      throw err; // Re-throw to allow handling in the component
    } finally {
      console.log('Finished wallet connection attempt');
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      console.log('Starting wallet disconnection...');
      
      // 1. Clear all React state first
      setIsConnected(false);
      setPublicKey(null);
      setNetwork(null);
      setError(null);
      
      // 2. Clear all storage and cookies
      if (typeof window !== 'undefined') {
        try {
          // Clear all storage
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear all cookies
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name] = cookie.split('=');
            const cookieName = name.trim();
            // Clear for all paths and domains
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
          }
          
          // Clear IndexedDB
          const dbs = await window.indexedDB.databases();
          for (const db of dbs) {
            if (db.name) {
              try {
                window.indexedDB.deleteDatabase(db.name);
              } catch (e) {
                console.warn(`Could not delete database ${db.name}`, e);
              }
            }
          }
          
          // Clear service worker caches
          if ('caches' in window) {
            try {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map(name => caches.delete(name)));
            } catch (e) {
              console.warn('Failed to clear caches', e);
            }
          }
          
          console.log('All storage cleared');
        } catch (storageError) {
          console.error('Error clearing storage:', storageError);
        }
      }
      
      // 3. Notify all components
      window.dispatchEvent(new CustomEvent('walletDisconnected'));
      
      // 4. Force a complete page refresh with cache busting
      if (typeof window !== 'undefined') {
        // Add a random parameter to ensure we don't get a cached version
        const timestamp = new Date().getTime();
        window.location.href = `${window.location.origin}?reset=${timestamp}`;
      }
      
    } catch (error) {
      console.error('Error during wallet disconnection:', error);
      
      // Final attempt - force a hard refresh
      if (typeof window !== 'undefined') {
        window.location.href = window.location.origin;
      }
    }
  };

  const value = {
    isConnected,
    publicKey,
    network,
    connect,
    disconnect,
    isLoading,
    error,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
