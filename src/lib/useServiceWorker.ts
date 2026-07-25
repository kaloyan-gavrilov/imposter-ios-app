'use client';

import { useEffect } from 'react';

/// Registers the offline shell. Dev is skipped so the cache never serves stale
/// bundles while iterating.
export function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Unsupported or blocked. The game still works, just not offline.
      });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
}
