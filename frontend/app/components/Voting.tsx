"use client";

import React, { useState, useEffect } from "react";
import * as freighterApi from '@stellar/freighter-api';

interface Candidate {
  id: number;
  name: string;
  description: string;
  voteCount: number;
}

export default function Voting() {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  // Initialize voted state from localStorage
  const [voted, setVoted] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: 1,
      name: "Proje A",
      description: "Yenilenebilir Enerji Çözümleri",
      voteCount: 0,
    },
    {
      id: 2,
      name: "Proje B",
      description: "Eğitim Teknolojileri Platformu",
      voteCount: 0,
    },
    {
      id: 3,
      name: "Proje C",
      description: "Sağlık Hizmetleri İnovasyonu",
      voteCount: 0,
    },
  ]);
  
  // Load voted status and vote counts from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load user's vote status
      const hasVoted = localStorage.getItem('userHasVoted') === 'true';
      setVoted(hasVoted);
      
      // Load candidate vote counts
      const savedCounts = localStorage.getItem('candidateVoteCounts');
      if (savedCounts) {
        try {
          const parsedCounts = JSON.parse(savedCounts);
          setCandidates(prev => prev.map(candidate => ({
            ...candidate,
            voteCount: parsedCounts[candidate.id] || 0
          })));
        } catch (error) {
          console.error('Error parsing saved vote counts:', error);
        }
      }
      
      // Check current wallet address
      checkWalletConnection();
    }
  }, []);
  
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
          
          // Check if this specific address has voted
          const addressHasVoted = localStorage.getItem(`address_${address}_voted`) === 'true';
          if (addressHasVoted) {
            setVoted(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const handleVote = async () => {
    if (selectedCandidate === null) return;

    try {
      setIsVoting(true);
      
      // Check if Freighter is connected using the official API
      const isConnected = await freighterApi.isConnected();
      
      if (!isConnected) {
        alert("Lütfen önce cüzdanınızı bağlayın!");
        return;
      }

      // Get the address and network from Freighter using official API
      const addressResponse = await freighterApi.getAddress();
      const networkResponse = await freighterApi.getNetwork();
      
      // Handle the response which could be a string or an object
      const address = typeof addressResponse === 'string' ? addressResponse : (addressResponse as any)?.address;
      const network = typeof networkResponse === 'string' ? networkResponse : (networkResponse as any)?.network;
      
      if (!address) {
        alert("Could not get wallet address");
        return;
      }
      
      console.log(`Voting for candidate ${selectedCandidate} from ${address} on ${network}`);
      
      // In a real app, you would interact with your Soroban contract here
      // For now, we'll simulate a successful vote after a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      const updatedCandidates = candidates.map(cand => 
        cand.id === selectedCandidate 
          ? { ...cand, voteCount: cand.voteCount + 1 } 
          : cand
      );
      
      setCandidates(updatedCandidates);
      setVoted(true);
      
      // Save vote status to localStorage
      localStorage.setItem('userHasVoted', 'true');
      
      // Save vote counts to localStorage
      const voteCounts = updatedCandidates.reduce((acc, candidate) => {
        acc[candidate.id] = candidate.voteCount;
        return acc;
      }, {} as Record<number, number>);
      
      localStorage.setItem('candidateVoteCounts', JSON.stringify(voteCounts));
      
      // If user has a connected wallet, save their specific vote status
      if (userAddress) {
        localStorage.setItem(`address_${userAddress}_voted`, 'true');
      }
      
      alert("Oyunuz başarıyla kaydedildi!");
    } catch (error) {
      console.error("Voting error:", error);
      alert("Oylama sırasında bir hata oluştu. Lütfen tekrar deneyin.");
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
