"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useInactivity(onInactive: () => void, onActive: () => void) {
  const [inactive, setInactive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactiveRef = useRef(false);

  const resetTimer = useCallback(() => {
    if (inactiveRef.current) {
      inactiveRef.current = false;
      setInactive(false);
      onActive();
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      inactiveRef.current = true;
      setInactive(true);
      onInactive();
    }, INACTIVITY_TIMEOUT_MS);
  }, [onInactive, onActive]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

    const handler = () => resetTimer();

    for (const event of events) {
      window.addEventListener(event, handler, { passive: true });
    }

    // Also listen for visibility changes
    const visibilityHandler = () => {
      if (document.visibilityState === "visible") {
        resetTimer();
      }
    };
    document.addEventListener("visibilitychange", visibilityHandler);

    resetTimer();

    return () => {
      for (const event of events) {
        window.removeEventListener(event, handler);
      }
      document.removeEventListener("visibilitychange", visibilityHandler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return inactive;
}
