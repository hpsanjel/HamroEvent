import { useEffect, useState, useRef } from "react";
import { hydrateStore } from "@/lib/store";

// Global flag to track hydration state
declare global {
  interface Window {
    __PP_HYDRATED__?: boolean;
    __PP_STORE_INIT__?: boolean;
  }
}

// Global tracking to prevent multiple initializations
let globalStoreInitialized = false;

/** Re-renders on any pp:store event. Also kicks off DB hydration. */
export function useStoreSignal() {
  console.log('[useStoreSignal] Hook called');
  const [, setTick] = useState(0);
  const initializedRef = useRef(false);
  
  useEffect(() => {
    console.log('[useStoreSignal] useEffect triggered, initialized:', initializedRef.current, 'global:', globalStoreInitialized);
    
    // Prevent multiple initializations across components
    if (!initializedRef.current && !globalStoreInitialized) {
      initializedRef.current = true;
      globalStoreInitialized = true;
      console.log('[useStoreSignal] Starting hydration (first time only)');
      hydrateStore().catch(err => {
        console.error('[useStoreSignal] Hydration failed:', err);
      });
    }
    
    const handler = () => {
      console.log('[useStoreSignal] pp:store event received');
      setTick((n) => n + 1);
    };
    
    window.addEventListener("pp:store", handler);
    console.log('[useStoreSignal] Event listener added');
    
    return () => {
      console.log('[useStoreSignal] Cleanup triggered');
      window.removeEventListener("pp:store", handler);
    };
  }, []);
}

/** True once initial DB load has completed (signaled by 'hydrated' event). */
export function useHydrated() {
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    const checkHydration = () => {
      if (window.__PP_HYDRATED__) {
        setReady(true);
      } else {
        // Listen for hydration event
        const handleHydrated = () => {
          setReady(true);
          window.removeEventListener('pp:store', handleHydrated);
        };
        window.addEventListener('pp:store', handleHydrated);
        
        // Fallback timeout
        setTimeout(() => {
          if (!window.__PP_HYDRATED__) {
            console.warn('[useHydrated] Hydration timeout - proceeding anyway');
            setReady(true);
          }
        }, 5000);
      }
    };
    
    checkHydration();
  }, []);
  return ready;
}
