"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import FreighterConnector from './components/FreighterConnector';

// No longer using old WalletConnection component

const Voting = dynamic<{}>(
  () => import('./components/Voting').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-64 flex items-center justify-center">
        <div className="animate-pulse">Oylama yükleniyor...</div>
      </div>
    )
  }
);

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Stellar Oylama DApp
          </h1>
          <p className="text-gray-400">
            Favori projenize oy verin ve Stellar ağı üzerinden destekleyin
          </p>
        </header>

        <main className="grid grid-cols-1 gap-8">
          {/* Freighter Connector using official @stellar/freighter-api package */}
          <div className="bg-gray-800 p-2 rounded-lg">
            <FreighterConnector />
          </div>
          
          <Suspense fallback={
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-64 flex items-center justify-center">
              <div className="animate-pulse">Oylama yükleniyor...</div>
            </div>
          }>
            <Voting />
          </Suspense>
        </main>

        {/* Removed debug component */}

        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Stellar ağı üzerinde çalışan merkeziyetsiz oylama uygulaması</p>
          <p className="mt-2">© {new Date().getFullYear()} Stellar Voting DApp</p>
        </footer>
      </div>
    </div>
  );
}
