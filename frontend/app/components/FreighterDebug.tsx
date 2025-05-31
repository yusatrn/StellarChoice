"use client";

import React, { useEffect, useState } from 'react';

export default function FreighterDebug() {
  const [debugInfo, setDebugInfo] = useState<{
    hasFreighter: boolean;
    hasFreighterApi: boolean;
    freighterProperties: string[];
    freighterApiProperties: string[];
    freighterMethods: string[];
    freighterApiMethods: string[];
    checkCount: number;
    lastChecked: string;
  }>({
    hasFreighter: false,
    hasFreighterApi: false,
    freighterProperties: [],
    freighterApiProperties: [],
    freighterMethods: [],
    freighterApiMethods: [],
    checkCount: 0,
    lastChecked: new Date().toLocaleTimeString()
  });

  useEffect(() => {
    // Check for Freighter extension immediately
    checkFreighter();
    
    // And then check again after intervals to see if it appears later
    const timeoutId = setTimeout(checkFreighter, 2000);
    const timeoutId2 = setTimeout(checkFreighter, 5000);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, []);
  
  const checkFreighter = () => {
    const hasFreighter = typeof window !== 'undefined' && !!window.freighter;
    const hasFreighterApi = typeof window !== 'undefined' && !!window.freighterApi;
    
    // Get all properties including non-enumerable ones
    const freighterProperties = hasFreighter 
      ? Object.getOwnPropertyNames(window.freighter || {})
      : [];
      
    const freighterApiProperties = hasFreighterApi 
      ? Object.getOwnPropertyNames(window.freighterApi || {})
      : [];
    
    // Get only method names
    const freighterMethods = hasFreighter 
      ? freighterProperties.filter(prop => typeof (window.freighter as any)[prop] === 'function')
      : [];
      
    const freighterApiMethods = hasFreighterApi 
      ? freighterApiProperties.filter(prop => typeof (window.freighterApi as any)[prop] === 'function')
      : [];
    
    setDebugInfo(prev => ({
      hasFreighter,
      hasFreighterApi,
      freighterProperties,
      freighterApiProperties,
      freighterMethods,
      freighterApiMethods,
      checkCount: prev.checkCount + 1,
      lastChecked: new Date().toLocaleTimeString()
    }));
    
    console.log('🔍 Freighter Debug Info:', {
      hasFreighter,
      hasFreighterApi,
      freighterProperties,
      freighterApiProperties,
      freighterMethods,
      freighterApiMethods
    });
  };

  // Function to manually probe for extension - sometimes this helps trigger detection
  const probeForExtension = () => {
    console.log('🔍 Probing for extension...');
    
    // Try to access the extension in different ways
    if (typeof window !== 'undefined') {
      // Method 1: Try direct property access
      const f1 = window.freighter;
      const f2 = window.freighterApi;
      
      // Method 2: Try iterating window properties (can sometimes trigger lazy loading)
      Object.keys(window).forEach(key => {
        if (key.toLowerCase().includes('freighter')) {
          console.log(`Found potential Freighter property: ${key}`);
        }
      });
      
      // Method 3: Check navigator extensions if available
      if (navigator.userAgent.includes('Chrome')) {
        console.log('Chrome detected, extension should be accessible if installed');
      }
      
      // After probing, check if it helped
      setTimeout(checkFreighter, 200);
    }
  };

  // Try to reload the page with a cache bypass
  const reloadPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded-md my-4">
      <h2 className="text-xl font-bold mb-2">Freighter Debug Info</h2>
      
      <div className="mb-2">
        <p>Check count: {debugInfo.checkCount}</p>
        <p>Last checked: {debugInfo.lastChecked}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="font-semibold">window.freighter</h3>
          <p>Available: {debugInfo.hasFreighter ? 'Yes ✅' : 'No ❌'}</p>
          {debugInfo.hasFreighter && (
            <div>
              <p className="font-medium mt-2">Methods:</p>
              <ul className="list-disc pl-5">
                {debugInfo.freighterMethods.map(method => (
                  <li key={method}>{method}()</li>
                ))}
              </ul>
              
              {debugInfo.freighterProperties.length > debugInfo.freighterMethods.length && (
                <>
                  <p className="font-medium mt-2">Other Properties:</p>
                  <ul className="list-disc pl-5">
                    {debugInfo.freighterProperties
                      .filter(prop => !debugInfo.freighterMethods.includes(prop))
                      .map(prop => <li key={prop}>{prop}</li>)
                    }
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
        
        <div>
          <h3 className="font-semibold">window.freighterApi</h3>
          <p>Available: {debugInfo.hasFreighterApi ? 'Yes ✅' : 'No ❌'}</p>
          {debugInfo.hasFreighterApi && (
            <div>
              <p className="font-medium mt-2">Methods:</p>
              <ul className="list-disc pl-5">
                {debugInfo.freighterApiMethods.map(method => (
                  <li key={method}>{method}()</li>
                ))}
              </ul>
              
              {debugInfo.freighterApiProperties.length > debugInfo.freighterApiMethods.length && (
                <>
                  <p className="font-medium mt-2">Other Properties:</p>
                  <ul className="list-disc pl-5">
                    {debugInfo.freighterApiProperties
                      .filter(prop => !debugInfo.freighterApiMethods.includes(prop))
                      .map(prop => <li key={prop}>{prop}</li>)
                    }
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button 
          onClick={checkFreighter}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        >
          Check Again
        </button>
        
        <button 
          onClick={probeForExtension}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
        >
          Probe for Extension
        </button>
        
        <button 
          onClick={reloadPage}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
