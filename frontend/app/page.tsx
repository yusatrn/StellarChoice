"use client";

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import FreighterConnector from './components/FreighterConnector';

const Voting = dynamic<{}>(
  () => import('./components/Voting').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700/50 h-96 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-indigo-200">Oylama yükleniyor...</p>
        </div>
      </div>
    )
  }
);

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-indigo-500/10"
              style={{
                width: Math.random() * 300 + 100 + 'px',
                height: Math.random() * 300 + 100 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                filter: 'blur(40px)',
                transform: `scale(${Math.random() * 0.5 + 0.5})`,
                opacity: Math.random() * 0.3 + 0.1,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <motion.header 
          className="text-center mb-16 lg:mb-20"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="text-sm font-medium text-indigo-300">Stellar Ağı Üzerinde Çalışıyor</span>
          </motion.div>
          
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
          >
            Merkeziyetsiz Oylama
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto"
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
          >
            Blokzincir teknolojisiyle güvenli ve şeffaf oylamalar düzenleyin, topluluk kararlarınızı merkeziyetsiz bir şekilde alın.
          </motion.p>
        </motion.header>

        {/* Main Content */}
        <motion.main 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3
              }
            }
          }}
        >
          {/* Wallet Connection Card */}
          <motion.div 
            className="lg:col-span-1"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700/50">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                Cüzdan Bağlantısı
              </h2>
              <div className="space-y-4">
                <FreighterConnector />
                <p className="text-sm text-gray-400 mt-3">
                  Oylamaya katılmak için lütfen Freighter cüzdanınızı bağlayın. Henüz cüzdanınız yoksa <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">buradan</a> yükleyebilirsiniz.
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Voting Section */}
          <motion.div 
            className="lg:col-span-2"
            variants={fadeInUp}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Suspense fallback={
              <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700/50 h-96 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-lg font-medium text-indigo-200">Oylama yükleniyor...</p>
                </div>
              </div>
            }>
              <Voting />
            </Suspense>
          </motion.div>
        </motion.main>

        {/* Footer */}
        <motion.footer 
          className="mt-20 text-center text-gray-400 text-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <p>Stellar ağı üzerinde çalışan merkeziyetsiz oylama uygulaması</p>
            <span className="hidden sm:inline-block w-1 h-1 bg-gray-600 rounded-full"></span>
            <p>© {new Date().getFullYear()} StellarChoice</p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
