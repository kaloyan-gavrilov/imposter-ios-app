'use client';

import { useEffect, useRef, useState } from 'react';

/// A pausable countdown that survives the tab being backgrounded.
///
/// `setInterval` is throttled hard in background tabs, so counting ticks would
/// drift badly over a three-minute discussion. Instead the deadline is stored as
/// an absolute timestamp and the remaining time is derived on every tick — the
/// interval only decides how often the display refreshes.
export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(seconds > 0);
  const deadline = useRef(Date.now() + seconds * 1000);

  useEffect(() => {
    deadline.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    setRunning(seconds > 0);
  }, [seconds]);

  useEffect(() => {
    if (!running || seconds === 0) return;

    const tick = () => {
      const left = Math.max(
        0,
        Math.round((deadline.current - Date.now()) / 1000),
      );
      setRemaining(left);
      if (left === 0) setRunning(false);
    };

    tick();
    const id = setInterval(tick, 250);
    // Re-sync the moment the tab comes back, rather than waiting for a tick.
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [running, seconds]);

  function toggle() {
    if (running) {
      setRunning(false);
    } else if (remaining > 0) {
      deadline.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  }

  return { remaining, running, toggle };
}

/// Keeps the screen awake while the phone sits untouched during discussion.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch {
        // Denied or unsupported. The timer still works, the screen may dim.
      }
      if (cancelled) void sentinel?.release();
    };

    void request();
    // Locks drop when the tab is hidden, so re-take one on return.
    const reacquire = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', reacquire);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', reacquire);
      void sentinel?.release();
    };
  }, [active]);
}
