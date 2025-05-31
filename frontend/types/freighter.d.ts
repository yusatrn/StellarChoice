// Type definitions for @stellar/freighter-api

interface FreighterAPI {
  isConnected: () => Promise<boolean | { isConnected: boolean }>;
  getAddress: () => Promise<string | { address: string }>;
  getNetwork: () => Promise<string | { network: string; networkPassphrase?: string }>;
  requestAccess: () => Promise<void>;
  // Add other methods as needed
}

declare global {
  interface Window {
    freighter?: FreighterAPI;
    freighterApi?: FreighterAPI;
  }
}

export type { FreighterAPI };
