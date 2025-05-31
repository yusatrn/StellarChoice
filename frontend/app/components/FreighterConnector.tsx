"use client";

import React, { useEffect, useState } from 'react';
import * as freighterApi from '@stellar/freighter-api';

// Component to directly use the official Freighter API
export default function FreighterConnector() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Freighter is available using the official API
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        // This is the official way to check if Freighter is installed
        const available = await freighterApi.isConnected();
        console.log('Freighter availability check:', available);
        setIsAvailable(!!available); // Convert to boolean
        
        // If connected, get the public key and network
        if (available) {
          await getAccountInfo();
        }
      } catch (err) {
        console.error('Error checking Freighter availability:', err);
        setError('Freighter kullanılabilirliği kontrol edilirken hata oluştu.');
      }
    };
    
    // Check immediately and again after a delay
    checkAvailability();
    
    const timeoutId = setTimeout(checkAvailability, 2000);
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Get account information if connected
  const getAccountInfo = async () => {
    try {
      // Use getAddress() instead of getPublicKey() for newer API versions
      const addressResponse = await freighterApi.getAddress();
      // Handle both string and object response formats
      const publicKey = typeof addressResponse === 'string' 
        ? addressResponse 
        : (addressResponse as any).address || '';
      setPublicKey(publicKey);
      
      const network = await freighterApi.getNetwork();
      setNetwork(typeof network === 'string' ? network : (network as any).network);
      
      setError(null);
    } catch (err) {
      console.error('Error getting account info:', err);
      setPublicKey(null);
      setNetwork(null);
    }
  };
  
  // Connect to Freighter
  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Request user permission to connect
      await freighterApi.requestAccess();
      
      // Check if connected after requesting access
      const isConnected = await freighterApi.isConnected();
      setIsAvailable(!!isConnected); // Convert to boolean
      
      if (isConnected) {
        await getAccountInfo();
      } else {
        setError('Bağlantı kuruldu ancak cüzdan erişim vermedi.');
      }
    } catch (err) {
      console.error('Error connecting to Freighter:', err);
      setError('Freighter\'a bağlanırken bir hata oluştu. Cüzdanınızın yüklü ve etkin olduğundan emin olun.');
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Manually check status
  const checkStatus = async () => {
    setIsConnecting(true);
    try {
      const available = await freighterApi.isConnected();
      setIsAvailable(!!available); // Convert to boolean
      
      if (available) {
        await getAccountInfo();
      }
    } catch (err) {
      console.error('Error checking status:', err);
      setError('Durum kontrol edilirken bir hata oluştu.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Freighter Cüzdan Bağlantısı</h2>
      
      {isConnecting ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-white">İşlem yapılıyor...</span>
        </div>
      ) : isAvailable && publicKey ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm text-gray-400 mb-1">Cüzdan Adresi</h3>
            <p className="bg-gray-900 p-2 rounded-md text-white text-sm break-all">
              {publicKey}
            </p>
          </div>
          
          {network && (
            <div>
              <h3 className="text-sm text-gray-400 mb-1">Ağ</h3>
              <p className="bg-gray-900 p-2 rounded-md text-white text-sm">
                {network}
              </p>
            </div>
          )}
          
          <button
            onClick={checkStatus}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200"
          >
            Yenile
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-md p-3 mb-4 text-red-200 text-sm">
              {error}
            </div>
          )}
          
          <div className="bg-gray-900 p-4 rounded-md mb-4">
            <p className="text-gray-300 text-sm">
              {isAvailable 
                ? "Freighter cüzdanı tespit edildi. Bağlanmak için düğmeye tıklayın." 
                : "Freighter cüzdanı tespit edilemedi. Lütfen eklentinin yüklü ve etkin olduğundan emin olun."}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={connectWallet}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isConnecting}
            >
              Cüzdana Bağlan
            </button>
            
            <button
              onClick={checkStatus}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition duration-200"
            >
              Durumu Kontrol Et
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
