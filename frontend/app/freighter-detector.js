// This script attempts to detect Freighter as early as possible
// It runs before React and other libraries are initialized

(function detectFreighter() {
  console.log('🔍 Early Freighter detection script running...');
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  // Function to log Freighter status
  function checkFreighter() {
    console.log('⚡ Checking Freighter availability:');
    console.log('window.freighter exists:', !!window.freighter);
    console.log('window.freighterApi exists:', !!window.freighterApi);
    
    if (window.freighter) {
      console.log('window.freighter methods:', 
        Object.getOwnPropertyNames(window.freighter)
          .filter(prop => typeof window.freighter[prop] === 'function')
      );
    }
    
    if (window.freighterApi) {
      console.log('window.freighterApi methods:', 
        Object.getOwnPropertyNames(window.freighterApi)
          .filter(prop => typeof window.freighterApi[prop] === 'function')
      );
    }
  }
  
  // Check immediately
  checkFreighter();
  
  // Check after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkFreighter);
  }
  
  // Check after window is fully loaded
  window.addEventListener('load', checkFreighter);
  
  // Check after a delay
  setTimeout(checkFreighter, 1000);
  setTimeout(checkFreighter, 3000);
  
  // Create a global function that can be called from browser console
  window.checkFreighterStatus = checkFreighter;
  
  console.log('✅ Freighter detection script initialized');
})();
