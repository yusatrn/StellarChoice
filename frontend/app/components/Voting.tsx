"use client";

import React, { useState, useEffect } from "react";
import * as freighterApi from '@stellar/freighter-api';
import { 
  xdr,
  scValToNative,
  nativeToScVal,
  StrKey
} from '@stellar/stellar-sdk'; 
import { 
  callContractFunction, 
  sendTransaction, 
  getTransactionStatus 
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
  const [userAddress, setUserAddress] = useState<string | null>(null);
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
    if (!userAddress) return;
    
    try {
      const updatedCandidates = [...candidates];
      for (let i = 0; i < updatedCandidates.length; i++) {
        try {
          const result = await callContractFunction(
            'get_vote_count',
            [u32ToScVal(i)],
            userAddress
          );
          const count = scValToValue(result);
          updatedCandidates[i] = {
            ...updatedCandidates[i],
            voteCount: Number(count) || 0
          };
        } catch (error) {
          console.error(`Aday ${i} için oy yüklenirken hata:`, error);
          // Hata durumunda oy sayısını sıfırla
          updatedCandidates[i] = {
            ...updatedCandidates[i],
            voteCount: 0
          };
        }
      }
      setCandidates(updatedCandidates);
    } catch (error) {
      console.error('Oy sayıları yüklenirken hata:', error);
    }
  };

  // Kullanıcının oy kullanıp kullanmadığını kontrol et
  const checkUserVoteStatus = async (address: string) => {
    if (!address) return false;
    
    try {
      const result = await callContractFunction(
        'has_voted',
        [addressToScVal(address)],
        address
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

  // Bileşen yüklendiğinde verileri yükle
  useEffect(() => {
    const loadData = async () => {
      const address = await checkWalletConnection();
      if (address) {
        await Promise.all([
          loadVoteCounts(),
          checkUserVoteStatus(address)
        ]);
      }
    };
    
    loadData();
  }, [userAddress]);
  
  // Check wallet connection and update state
  const checkWalletConnection = async () => {
    try {
      const isConnected = await freighterApi.isConnected();
      
      if (isConnected) {
        const addressResponse = await freighterApi.getAddress();
        const address = typeof addressResponse === 'string' 
          ? addressResponse 
          : (addressResponse as any)?.address;
        
        if (address) {
          setUserAddress(address);
          return address;
        }
      }
      return null;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return null;
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
      alert("Lütfen bir aday seçin");
      return;
    }

    try {
      setIsVoting(true);
      
      // Cüzdan bağlantısını kontrol et ve adresi al
      const address = await checkWalletConnection();
      if (!address) {
        alert("Lütfen önce cüzdanınızı bağlayın!");
        return;
      }

      try {
        // Daha önce oy kullanıp kullanmadığını kontrol et
        const hasVotedResult = await callContractFunction(
          'has_voted',
          [addressToScVal(address)],
          address
        );
        
        const hasUserVoted = scValToValue(hasVotedResult);
        if (hasUserVoted) {
          alert("Zaten oy kullandınız!");
          setVoted(true);
          return;
        }

        // Oy verme işlemini gerçekleştir
        await callContractFunction(
          'vote',
          [
            addressToScVal(address),
            u32ToScVal(selectedCandidate)
          ],
          address
        );

        // Başarılı olduğunda oy sayısını güncelle
        const voteCountResult = await callContractFunction(
          'get_vote_count',
          [u32ToScVal(selectedCandidate)],
          address
        );
        
        const newVoteCount = scValToValue(voteCountResult);
        
        // Arayüzü güncelle
        setCandidates(prev => prev.map(c => 
          c.id === selectedCandidate 
            ? { ...c, voteCount: newVoteCount } 
            : c
        ));
        
        setVoted(true);
        alert("Oyunuz başarıyla kaydedildi!");
      } catch (error) {
        console.error('Oylama sırasında hata:', error);
        throw error; // Hata yönetimi için yukarı fırlat
      }
    } catch (error) {
      console.error("Oylama hatası:", error);
      alert(`Oylama sırasında bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Projeleri Oyla</h2>
      
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
  );
}
