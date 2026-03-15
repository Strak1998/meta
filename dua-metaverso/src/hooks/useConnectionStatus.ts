"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type ConnectionState = "connected" | "reconnecting" | "disconnected";

interface ConnectionStatusOptions {
  chatConnected: boolean;
  eventConnected: boolean;
}

export function useConnectionStatus({
  chatConnected,
  eventConnected,
}: ConnectionStatusOptions): ConnectionState {
  const [status, setStatus] = useState<ConnectionState>("connected");
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const evaluate = useCallback(() => {
    const bothConnected = chatConnected && eventConnected;
    const anyConnected = chatConnected || eventConnected;

    if (bothConnected) {
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      setStatus("connected");
    } else if (anyConnected) {
      setStatus("reconnecting");
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = setTimeout(() => {
        setStatus("disconnected");
      }, 30_000);
    } else {
      setStatus("reconnecting");
      if (!disconnectTimerRef.current) {
        disconnectTimerRef.current = setTimeout(() => {
          setStatus("disconnected");
        }, 15_000);
      }
    }
  }, [chatConnected, eventConnected]);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  useEffect(() => {
    return () => {
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
      }
    };
  }, []);

  return status;
}
