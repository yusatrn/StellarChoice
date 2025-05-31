/**
 * Freighter Helper - Utility functions for interacting with Freighter wallet
 * This provides a more robust way to interact with the wallet when direct extension detection fails
 */

// Define the Freighter API interface
export interface FreighterAPI {
  isConnected: () => Promise<boolean | { isConnected: boolean }>;
  getPublicKey: () => Promise<string>;
  getAddress: () => Promise<string | { address: string }>;
  getNetwork: () => Promise<string | { network: string; networkPassphrase?: string }>;
  requestAccess: () => Promise<void>;
}

/**
 * Returns true if the Freighter extension is available
 */
export const isFreighterAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
    (!!window.freighter || !!window.freighterApi);
};

/**
 * Get a reference to the Freighter API, whether it's available as window.freighter or window.freighterApi
 */
export const getFreighterApi = (): FreighterAPI | null => {
  if (typeof window === 'undefined') return null;
  
  // Try both possible locations for the Freighter API
  const freighterApi = window.freighterApi || window.freighter;
  
  if (!freighterApi) return null;
  
  // Ensure the API has the required methods before returning
  if (typeof freighterApi.isConnected !== 'function') return null;
  
  return freighterApi as FreighterAPI;
};

/**
 * Try to get the user's public key from Freighter
 * Returns null if Freighter is not available or the user is not connected
 */
export const getFreighterPublicKey = async (): Promise<string | null> => {
  try {
    const freighter = getFreighterApi();
    if (!freighter) return null;
    
    // First check if connected
    const connResult = await freighter.isConnected();
    const isConnected = typeof connResult === 'boolean' ? connResult : connResult?.isConnected;
    
    if (!isConnected) return null;
    
    // Try getPublicKey first (older versions)
    if (typeof freighter.getPublicKey === 'function') {
      return await freighter.getPublicKey();
    }
    
    // Try getAddress (newer versions)
    if (typeof freighter.getAddress === 'function') {
      const result = await freighter.getAddress();
      return typeof result === 'string' ? result : result?.address || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting Freighter public key:', error);
    return null;
  }
};

/**
 * Try to get the network from Freighter
 */
export const getFreighterNetwork = async (): Promise<string | null> => {
  try {
    const freighter = getFreighterApi();
    if (!freighter) return null;
    
    const result = await freighter.getNetwork();
    return typeof result === 'string' ? result : result?.network || null;
  } catch (error) {
    console.error('Error getting Freighter network:', error);
    return null;
  }
};

/**
 * Request access to the user's Freighter wallet
 * Returns true if successful, false otherwise
 */
export const requestFreighterAccess = async (): Promise<boolean> => {
  try {
    const freighter = getFreighterApi();
    if (!freighter) return false;
    
    await freighter.requestAccess();
    return true;
  } catch (error) {
    console.error('Error requesting Freighter access:', error);
    return false;
  }
};
