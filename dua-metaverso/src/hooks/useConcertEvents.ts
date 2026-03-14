"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ConcertState } from "@/types/artist";
import { DEFAULT_CONCERT_STATE } from "@/types/artist";

export function useConcertEvents() {
  const [state, setState] = useState<ConcertState>(DEFAULT_CONCERT_STATE);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    esRef.current?.close();
    const es = new EventSource("/api/events");
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data) as Record<string, unknown>;
        switch (data.event) {
          case "state":
            setState({
              phase: (data.phase as string) ?? DEFAULT_CONCERT_STATE.phase,
              artists: (data.artists as ConcertState["artists"]) ?? DEFAULT_CONCERT_STATE.artists,
              commandLog: (data.commandLog as ConcertState["commandLog"]) ?? [],
            });
            break;
          case "phase":
            setState((prev) => ({ ...prev, phase: data.phase as string }));
            break;
          case "artist_status":
            setState((prev) => ({
              ...prev,
              artists: prev.artists.map((a) =>
                a.id === data.id ? { ...a, status: data.status as typeof a.status } : a
              ),
            }));
            break;
          case "command":
            setState((prev) => ({
              ...prev,
              commandLog: [...prev.commandLog.slice(-50), data as unknown as ConcertState["commandLog"][number]],
            }));
            break;
        }
      } catch { /* ignore */ }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      reconnectRef.current = setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  return { state, connected };
}
