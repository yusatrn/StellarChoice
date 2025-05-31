"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import * as freighterApi from '@stellar/freighter-api';
import { useWallet } from '@/app/contexts/WalletContext';
import { 
  xdr,
  scValToNative,
  nativeToScVal,
  StrKey
} from '@stellar/stellar-sdk'; 
import { 
  callContractFunction, 
  sendTransaction
} from '../lib/contractHelper';


interface Candidate {
  id: number;
  name: string;
  description: string;
  voteCount: number;
}

export default function Voting() {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTxStatus, setShowTxStatus] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    status: 'idle' | 'pending' | 'success' | 'error';
    message: string;
    txHash?: string;
  }>({ status: 'idle', message: '' });
  
  const { 
    publicKey: userAddress, 
    isConnected, 
    connect, 
    disconnect: disconnectWallet, 
    error: walletError, 
    isLoading: isWalletLoading 
  } = useWallet();
  
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      // First, clear all local state
      setVoted(false);
      setSelectedCandidate(null);
      setConnectionError(null);
      setCandidates(prev => prev.map(c => ({ ...c, voteCount: 0 })));
      
      // Then disconnect the wallet
      await disconnectWallet();
      
      // Clear any transaction status
      setShowTxStatus(false);
      setTransactionStatus({ status: 'idle', message: '' });
      
      // Force a page reload to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setShowTxStatus(true);
      setTransactionStatus({
        status: 'error',
        message: 'Çıkış yapılırken bir hata oluştu. Lütfen sayfayı yenileyin.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: 0, // Sözleşmede 0'dan başladığı için güncellendi
      name: "Proje A",
      description: "Yenilenebilir Enerji Çözümleri",
      voteCount: 0,
    },
    {
      id: 1,
      name: "Proje B",
      description: "Eğitim Teknolojileri Platformu",
      voteCount: 0,
    },
    {
      id: 2,
      name: "Proje C",
      description: "Sağlık Hizmetleri İnovasyonu",
      voteCount: 0,
    },
  ]);
  
  // Adayların oy sayılarını yükle
  const loadVoteCounts = async () => {
    console.log('loadVoteCounts called, userAddress:', userAddress);
    if (!userAddress) {
      console.log('No user address, skipping loadVoteCounts');
      return;
    }
    
    try {
      console.log('Loading vote counts for candidates:', candidates.length);
      const updatedCandidates = [...candidates];
      
      // Load votes for each candidate
      const votePromises = updatedCandidates.map(async (candidate, index) => {
        console.log(`Loading vote count for candidate ${index} (${candidate.name})`);
        try {
          const result = await callContractFunction(
            'get_vote_count',
            [u32ToScVal(index)],
            userAddress,
            true // read-only
          );
          
          console.log(`Got vote count for candidate ${index}:`, result);
          
          if (result) {
            const count = scValToValue(result);
            console.log(`Converted vote count for candidate ${index}:`, count);
            return {
              ...candidate,
              voteCount: Number(count) || 0
            };
          }
          return candidate;
        } catch (error) {
          console.error(`Aday ${index} (${candidate.name}) için oy yüklenirken hata:`, error);
          return {
            ...candidate,
            voteCount: 0
          };
        }
      });
      
      // Wait for all votes to load
      const updated = await Promise.all(votePromises);
      console.log('All vote counts loaded:', updated);
      
      // Update state with new vote counts
      setCandidates(updated);
      
    } catch (error) {
      console.error('Oy sayıları yüklenirken genel hata:', error);
      // Reset all vote counts to 0 in case of error
      setCandidates(prev => {
        const reset = prev.map(c => ({
          ...c,
          voteCount: 0
        }));
        console.log('Reset vote counts due to error:', reset);
        return reset;
      });
    }
  };

  // Kullanıcının oy kullanıp kullanmadığını kontrol et
  const checkUserVoteStatus = async (address: string) => {
    if (!address) return false;
    
    try {
      const result = await callContractFunction(
        'has_voted',
        [addressToScVal(address)],
        address,
        true // read-only operation
      );
      const hasVotedStatus = Boolean(scValToValue(result));
      setVoted(hasVotedStatus);
      return hasVotedStatus;
    } catch (error) {
      console.error('Oy durumu kontrol edilirken hata:', error);
      setVoted(false);
      return false;
    }
  };

  // Check wallet connection on component mount and when wallet state changes
  useEffect(() => {
    console.log('Wallet connection state changed:', { isConnected, userAddress });
    
    const handleWalletConnection = async () => {
      if (isConnected && userAddress) {
        console.log('Wallet connected, loading data...');
        try {
          console.log('Loading vote counts and user vote status...');
          await Promise.all([
            loadVoteCounts(),
            checkUserVoteStatus(userAddress)
          ]);
          console.log('Data loaded successfully');
        } catch (error) {
          console.error('Veri yüklenirken hata oluştu:', error);
          setShowTxStatus(true);
          setTransactionStatus({
            status: 'error',
            message: 'Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.'
          });
        }
      } else if (!isConnected && !isWalletLoading) {
        console.log('Wallet not connected, showing connect button');
        // Don't automatically connect, wait for user to click the connect button
      }
    };
    
    handleWalletConnection();
  }, [isConnected, userAddress, isWalletLoading]);
  
  // Cüzdan bağlantısını kontrol et
  const checkWalletConnection = async () => {
    console.log('Checking wallet connection...');
    if (!isConnected) {
      console.log('Wallet not connected, attempting to connect...');
      setIsConnecting(true);
      setConnectionError(null);
      try {
        await connect();
        console.log('Wallet connected successfully');
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
        setConnectionError(`Cüzdana bağlanılamadı: ${errorMessage}`);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    } else {
      console.log('Wallet already connected');
    }
  };

  // Adresi ScVal'a dönüştür
  const addressToScVal = (address: string): xdr.ScVal => {
    // Stellar adresini binary'ye çevir
    const publicKey = StrKey.decodeEd25519PublicKey(address);
    return xdr.ScVal.scvAddress(
      xdr.ScAddress.scAddressTypeAccount(
        xdr.PublicKey.publicKeyTypeEd25519(publicKey)
      )
    );
  };

  // Sayıyı ScVal'a dönüştür
  const u32ToScVal = (value: number): xdr.ScVal => {
    return xdr.ScVal.scvU32(value);
  };

  // ScVal'dan değer çıkar
  const scValToValue = (val: any): any => {
    try {
      if (val === null || val === undefined) return val;
      return scValToNative(val);
    } catch (error) {
      console.error('Error converting ScVal:', error, val);
      return val;
    }
  };

  const handleVote = async () => {
    if (selectedCandidate === null) {
      setShowTxStatus(true);
      setTransactionStatus({
        status: 'error',
        message: 'Lütfen bir aday seçiniz'
      });
      return;
    }
  
    try {
      // Kullanıcıyı onay için uyar
      const confirmVote = window.confirm(
        `"${candidates[selectedCandidate].name}" adayına oy vermek istediğinizden emin misiniz?`
      );
      
      if (!confirmVote) {
        return;
      }
  
      // Oy verme işlemini gerçekleştir
      if (!userAddress) {
        setShowTxStatus(true);
        setTransactionStatus({
          status: 'error',
          message: 'Kullanıcı adresi bulunamadı. Lütfen cüzdan bağlantınızı kontrol edin.'
        });
        return;
      }

      setIsVoting(true);
      setShowTxStatus(true);
      setTransactionStatus({
        status: 'pending',
        message: 'Oyunuz gönderiliyor, lütfen bekleyin...'
      });
      
      try {
        // 1. First, submit the vote transaction
        await callContractFunction(
          'vote',
          [
            addressToScVal(userAddress),
            u32ToScVal(selectedCandidate)
          ],
          userAddress,
          false, // write operation
          120000 // 2 dakika timeout
        );
    
        // 2. After successful vote, refresh the vote counts from the blockchain
        await loadVoteCounts();
        
        // 3. Also update the local state to reflect the user has voted
        setVoted(true);
        
        // 4. Show success status and reload the page after a short delay
        setTransactionStatus({
          status: 'success',
          message: 'Oyunuz başarıyla kaydedildi! Sayfa yenileniyor...'
        });
        
        // Reload the page after 2 seconds to show updated vote counts
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Voting error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu';
        
        let userFriendlyMessage = 'Oy verme işlemi başarısız oldu';
        
        if (errorMessage.includes('timeout')) {
          userFriendlyMessage = 'İşlem zaman aşımına uğradı. Lütfen bağlantınızı kontrol edip tekrar deneyin.';
        } else if (errorMessage.includes('insufficient')) {
          userFriendlyMessage = 'Yetersiz bakiye. Lütfen cüzdanınızda yeterli XLM olduğundan emin olun.';
        } else if (errorMessage.includes('already voted')) {
          userFriendlyMessage = 'Zaten oy kullanmışsınız. Her kullanıcı sadece bir kez oy kullanabilir.';
        }
        
        setShowTxStatus(true);
        setTransactionStatus({
          status: 'error',
          message: userFriendlyMessage
        });
        
        throw error; // Re-throw to be caught by the outer catch
      } finally {
        setIsVoting(false);
      }
    } catch (error) {
      console.error('Oylama hatası:', error);
      setShowTxStatus(true);
      setTransactionStatus({
        status: 'error',
        message: `Oylama sırasında bir hata oluştu: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  // Show loading state while wallet is initializing
  if (isWalletLoading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Cüzdan bağlantısı kontrol ediliyor...</p>
      </div>
    );
  }

  // Show connection error if there is one
  if (walletError || connectionError) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white">
        <div className="bg-red-900/50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-300">
                {walletError || connectionError}
              </p>
              <div className="mt-4">
                <button
                  onClick={checkWalletConnection}
                  disabled={isConnecting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isConnecting ? 'Bağlanılıyor...' : 'Tekrar Dene'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Transaction status popup
  const renderTransactionStatus = () => {
    if (!showTxStatus) return null;
    
    type StatusType = 'pending' | 'success' | 'error';
    
    const statusConfig: Record<StatusType, {
      bg: string;
      border: string;
      icon: React.ReactNode;
    }> = {
      pending: {
        bg: 'bg-yellow-900/50',
        border: 'border-yellow-500',
        icon: (
          <svg className="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )
      },
      success: {
        bg: 'bg-green-900/50',
        border: 'border-green-500',
        icon: (
          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      },
      error: {
        bg: 'bg-red-900/50',
        border: 'border-red-500',
        icon: (
          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      }
    };
    
    const status = transactionStatus.status === 'idle' ? 'pending' : transactionStatus.status as StatusType;
    const config = statusConfig[status] || statusConfig.error;
    
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md w-full">
        <div className={`${config.bg} ${config.border} border-l-4 p-4 rounded-lg shadow-lg`}>
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {config.icon}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-white">
                {transactionStatus.message}
              </p>
              {transactionStatus.txHash && (
                <div className="mt-1">
                  <a 
                    href={`https://testnet.steexp.com/tx/${transactionStatus.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-300 hover:underline"
                  >
                    İşlemi Görüntüle
                  </a>
                </div>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button 
                onClick={() => setShowTxStatus(false)}
                className="text-gray-300 hover:text-white"
              >
                <span className="sr-only">Kapat</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Transaction status state is already declared at the top of the component

  return (
    <div className="relative">
      {renderTransactionStatus()}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Projeleri Oyla</h2>
          <div className="flex items-center space-x-4">
            {!isConnected ? (
              <button
                onClick={checkWalletConnection}
                disabled={isConnecting || isWalletLoading}
                className={`px-4 py-2 rounded-md font-medium flex items-center justify-center min-w-32 ${
                  isConnecting || isWalletLoading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                {isConnecting || isWalletLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Bağlanılıyor...
                  </>
                ) : 'Cüzdanı Bağla'}
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Çıkış Yap
                </button>
                <button
                  onClick={() => {
                    if (userAddress) {
                      loadVoteCounts();
                      checkUserVoteStatus(userAddress);
                    }
                  }}
                  disabled={isLoading || isVoting}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Yükleniyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Yenile
                    </>
                  )}
                </button>
              </div>
            )}
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm">
                {isConnected ? 'Bağlandı' : 'Bağlantı Yok'}
              </span>
            </div>
          </div>
        </div>
      
      <div className="space-y-4">
        {candidates.map((candidate) => (
          <div 
            key={candidate.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedCandidate === candidate.id 
                ? 'border-blue-500 bg-blue-900/20' 
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setSelectedCandidate(candidate.id)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{candidate.name}</h3>
                <p className="text-gray-300 text-sm">{candidate.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{candidate.voteCount}</div>
                <div className="text-xs text-gray-400">oy</div>
              </div>
            </div>
            {totalVotes > 0 && (
              <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ 
                    width: `${(candidate.voteCount / Math.max(1, totalVotes)) * 100}%`,
                    transition: 'width 0.5s ease-in-out'
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={handleVote}
          disabled={selectedCandidate === null || isVoting || voted}
          className={`w-full py-3 px-4 rounded-lg font-bold transition-colors ${
            selectedCandidate === null || voted
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isVoting 
            ? 'İşleniyor...' 
            : voted 
              ? 'Oyunuz Kaydedildi!' 
              : 'Oy Ver'}
        </button>
      </div>
      
      <p className="mt-4 text-sm text-gray-400 text-center">
        Toplam oy: {totalVotes}
      </p>
      </div>
    </div>
  );
}
