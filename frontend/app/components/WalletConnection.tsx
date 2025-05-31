"use client";

import React, { useCallback, useEffect, useState } from "react";
import { 
  isFreighterAvailable, 
  getFreighterApi, 
  getFreighterPublicKey, 
  getFreighterNetwork,
  requestFreighterAccess 
} from "../utils/freighterHelper";

// The FreighterAPI interface and window declarations are now imported from freighterHelper.ts

interface WalletConnectionProps {}

const WalletConnection: React.FC<WalletConnectionProps> = () => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [freighterAvailable, setFreighterAvailable] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  
  // Memoize the checkFreighter function to prevent unnecessary re-renders
  const checkFreighter = useCallback(async () => {
    if (!isClient) return;
    setIsLoading(true);
    console.log('🔍 Checking Freighter connection...');
    
    // Add a small delay to allow the extension to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Check if Freighter is available using our helper
      const available = isFreighterAvailable();
      console.log('🔍 Freighter available:', available ? 'Yes' : 'No');
      
      // Get the Freighter API (returns null if not available)
      const freighterApi = getFreighterApi();
      
      // Check if Freighter is installed and has the required methods
      if (!freighterApi) {
        console.log('💡 Freighter not detected or incomplete API. Make sure the extension is installed and enabled.');
        // Log additional helpful information
        console.log('📌 Debug info: window.freighter =', window.freighter);
        console.log('📌 Debug info: window.freighterApi =', window.freighterApi);
        console.log('📌 Please ensure the Freighter extension is installed and enabled in your browser');
        setFreighterAvailable(false);
        return;
      }

      console.log('✅ Freighter detected, checking connection status...');
      setFreighterAvailable(true);
      
      try {
        // Check connection status
        const connection = await freighterApi.isConnected();
        const isConnected = typeof connection === 'boolean' ? connection : connection.isConnected;
        
        console.log('💪 Connection status:', isConnected ? 'Connected' : 'Not connected');
        setIsConnected(isConnected);
        
        if (isConnected) {
          try {
            // Get wallet address - try both methods
            let address = null;
            if (typeof freighterApi.getPublicKey === 'function') {
              address = await freighterApi.getPublicKey();
            } else if (typeof freighterApi.getAddress === 'function') {
              const addressResponse = await freighterApi.getAddress();
              address = typeof addressResponse === 'string' ? addressResponse : addressResponse.address;
            }
            
            if (address) {
              console.log('💰 Wallet address:', address);
              setPublicKey(address);
            }
            
            // Get network
            const networkResponse = await freighterApi.getNetwork();
            const network = typeof networkResponse === 'string' ? 
              networkResponse : 
              networkResponse.network;
              
            console.log('🌐 Network:', network);
            setNetwork(network);
          } catch (error) {
            console.error('Error getting wallet details:', error);
          }
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('✖ Unexpected error checking Freighter:', error);
      setFreighterAvailable(false);
      setIsConnected(false);
      setPublicKey(null);
      setNetwork('');
    } finally {
      setIsLoading(false);
    }
  }, [isClient]);

  // Set client-side flag on mount
  useEffect(() => {
    // Run on the client side only
    setIsClient(true);
    
    // Wait for window to fully load before checking for Freighter
    const onLoad = () => {
      // Sometimes Freighter takes a moment to initialize after page load
      let attempts = 0;
      const maxAttempts = 5;
      const attemptInterval = 1000; // 1 second between attempts
      
      const attemptConnection = () => {
        if (attempts < maxAttempts) {
          console.log(`🔄 Attempting to detect Freighter (attempt ${attempts + 1}/${maxAttempts})`);
          checkFreighter();
          attempts++;
          
          // If Freighter was found, no need to continue attempts
          if (window.freighter || window.freighterApi) {
            console.log('✅ Freighter detected on attempt', attempts);
            return;
          }
          
          // Try again after interval
          setTimeout(attemptConnection, attemptInterval);
        } else {
          console.log('❌ Max attempts reached. Freighter not detected.');
        }
      };
      
      // Start trying to connect
      attemptConnection();
    };
    
    // If document is already loaded, run onLoad immediately
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
      return () => window.removeEventListener('load', onLoad);
    }
  }, [checkFreighter]);

  // Handle connect wallet button click
  const handleConnectWallet = async () => {
    setIsLoading(true);
    try {
      // Use our helper function to request access
      const success = await requestFreighterAccess();
      
      if (!success) {
        alert('Lütfen Freighter cüzdanını yükleyin!');
        window.open('https://www.freighter.app/', '_blank');
        return;
      }
      
      // Check connection status again
      checkFreighter();
    } catch (error) {
      console.error('❌ Error connecting to Freighter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      alert(`Cüzdan bağlantısı sırasında bir hata oluştu: ${errorMessage}. Lütfen tekrar deneyin.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render UI
  return (
    <div className="wallet-connection p-4 max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg">
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-300">Yükleniyor...</p>
        </div>
      ) : !freighterAvailable ? (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-400 mb-2">Freighter Cüzdanı Gerekli</h3>
          <p className="text-yellow-200 mb-4">
            Uygulamayı kullanabilmek için lütfen Freighter cüzdan eklentisini yükleyin veya etkinleştirin.
          </p>
          <div className="space-y-2">
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-yellow-600 hover:bg-yellow-700 text-white text-center font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              Freighter İndir
            </a>
            <button
              onClick={checkFreighter}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      ) : !isConnected ? (
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mb-4">Cüzdanınıza Bağlanın</h3>
          <button
            onClick={handleConnectWallet}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            {isLoading ? 'Bağlanıyor...' : 'Freighter ile Bağlan'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-400">Cüzdan Adresi</h3>
            <p className="mt-1 text-sm bg-gray-900 p-2 rounded break-all">
              {publicKey || 'Bilinmiyor'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">Ağ</h3>
            <p className="mt-1 text-sm bg-gray-900 p-2 rounded">
              {network || 'Bilinmiyor'}
            </p>
          </div>
          <button
            onClick={checkFreighter}
            disabled={isLoading}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            {isLoading ? 'Güncelleniyor...' : 'Bilgileri Güncelle'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
