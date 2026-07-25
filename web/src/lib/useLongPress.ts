'use client';

import { useCallback, useRef, type PointerEvent } from 'react';

const LONG_PRESS_MS = 450;

interface LongPressOptions {
  onTap: () => void;
  onLongPress: () => void;
}

/// Distinguishes a tap from a hold on touch and mouse alike. A long press fires
/// as soon as the threshold passes (matching SwiftUI's `onLongPressGesture`,
/// which does not wait for release) and suppresses the tap that would follow.
export function useLongPress({ onTap, onLongPress }: LongPressOptions) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      event.preventDefault();
      fired.current = false;
      clear();
      timer.current = setTimeout(() => {
        fired.current = true;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    [clear, onLongPress],
  );

  const onPointerUp = useCallback(() => {
    clear();
    if (!fired.current) onTap();
    fired.current = false;
  }, [clear, onTap]);

  const onPointerCancel = useCallback(() => {
    clear();
    fired.current = false;
  }, [clear]);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerLeave: onPointerCancel,
  };
}
