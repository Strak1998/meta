"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ConcertCommand, ConcertState, CommandType, OverlayType } from "@/types/artist";
import { defaultArtistSlots } from "@/lib/artist-registry";

const DEFAULT: ConcertState = {
  phase: "opening",
  artists: defaultArtistSlots(),
  audioMode: "silence",
  isPaused: false,
  phaseStartedAt: Date.now(),
  commandLog: [],
};

function applyCmd(prev: ConcertState, cmd: ConcertCommand): ConcertState {
  const p = cmd.payload ?? {};
  const log = [...(prev.commandLog ?? []).slice(-49), cmd];
  switch (cmd.type) {
    case "PHASE_CHANGE": return { ...prev, phase: p.phase as string, phaseStartedAt: Date.now(), commandLog: log };
    case "ARTIST_ENTER": return { ...prev, commandLog: log, spotlight: p.artistId as string, artists: prev.artists.map(a => a.id === p.artistId ? { ...a, status: "em_palco" as const, defaultPosition: (p.position as typeof a.defaultPosition) ?? a.defaultPosition } : a) };
    case "ARTIST_EXIT": return { ...prev, commandLog: log, spotlight: prev.spotlight === p.artistId ? undefined : prev.spotlight, artists: prev.artists.map(a => a.id === p.artistId ? { ...a, status: "saiu" as const } : a) };
    case "SPOTLIGHT": return { ...prev, spotlight: p.artistId as string | undefined, commandLog: log };
    case "AUDIO_SOURCE": return { ...prev, audioMode: p.mode as ConcertState["audioMode"], audioUrl: p.url as string | undefined, commandLog: log };
    case "OVERLAY_SHOW": return { ...prev, commandLog: log, activeOverlay: { type: p.overlayType as OverlayType, data: p, expiresAt: p.duration ? Date.now() + (p.duration as number) : undefined } };
    case "OVERLAY_HIDE": return { ...prev, activeOverlay: undefined, commandLog: log };
    case "EMERGENCY_PAUSE": return { ...prev, isPaused: true, commandLog: log };
    case "EMERGENCY_RESUME": return { ...prev, isPaused: false, commandLog: log };
    default: return { ...prev, commandLog: log };
  }
}

export function useConcertEvents() {
  const [state, setState] = useState<ConcertState>(DEFAULT);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(1000);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    esRef.current?.close();
    const es = new EventSource("/api/backstage/events");
    esRef.current = es;
    es.onopen = () => { setConnected(true); retryRef.current = 1000; };
    es.onmessage = (e: MessageEvent) => {
      try {
        const cmd = JSON.parse(e.data as string) as ConcertCommand;
        if (cmd.type === "PHASE_CHANGE" && (cmd.payload as Record<string, unknown>)?.init) {
          setState((cmd.payload as Record<string, unknown>).state as ConcertState);
          return;
        }
        setState(prev => applyCmd(prev, cmd));
      } catch {}
    };
    es.onerror = () => {
      setConnected(false); es.close(); esRef.current = null;
      const d = Math.min(retryRef.current, 30_000);
      retryRef.current = Math.min(d * 2, 30_000);
      timerRef.current = setTimeout(connect, d);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => { esRef.current?.close(); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [connect]);

  const dispatch = useCallback(async (type: CommandType, payload: Record<string, unknown> = {}): Promise<void> => {
    await fetch("/api/backstage/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, payload }) });
  }, []);

  return { state, connected, dispatch };
}
