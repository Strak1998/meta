"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Crown, Headphones, Loader2 } from "lucide-react";

/*
  VoiceRoom — 3-tier graceful degradation:
  1. LiveKit Cloud  → real room via @livekit/components-react
  2. Demo mode      → mock participants UI (no server token)
  3. Disconnected   → reconnect prompt

  Tier 1 activates when /api/livekit-token returns { mode: "livekit", token, wsUrl }.
  Tier 2 is the fallback when env vars are absent or LiveKit is unavailable.
*/

interface Participant {
  name: string;
  role: "dj" | "host" | "guest";
  speaking: boolean;
  muted: boolean;
}

const DEMO_PARTICIPANTS: Participant[] = [
  { name: "DUA DJ", role: "dj", speaking: true, muted: false },
  { name: "Carlos (Host)", role: "host", speaking: false, muted: false },
  { name: "Maria", role: "guest", speaking: true, muted: false },
  { name: "João", role: "guest", speaking: false, muted: true },
  { name: "Ana", role: "guest", speaking: false, muted: false },
  { name: "Pedro", role: "guest", speaking: true, muted: false },
];

type RoomMode = "loading" | "livekit" | "demo" | "disconnected";

interface TokenResponse {
  token: string | null;
  wsUrl: string | null;
  mode: "livekit" | "demo";
}

/* ─── Tier 1: LiveKit room (lazy-loaded to avoid SSR issues) ─── */
function LiveKitRoom({ token, wsUrl, onDisconnect }: { token: string; wsUrl: string; onDisconnect: () => void }) {
  const [LKComponents, setLKComponents] = useState<{
    LiveKitRoom: typeof import("@livekit/components-react").LiveKitRoom;
    RoomAudioRenderer: typeof import("@livekit/components-react").RoomAudioRenderer;
    useParticipants: typeof import("@livekit/components-react").useParticipants;
  } | null>(null);

  useEffect(() => {
    import("@livekit/components-react").then((mod) => {
      setLKComponents({
        LiveKitRoom: mod.LiveKitRoom,
        RoomAudioRenderer: mod.RoomAudioRenderer,
        useParticipants: mod.useParticipants,
      });
    }).catch(() => { /* fall through */ });
  }, []);

  if (!LKComponents) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
      </div>
    );
  }

  const { LiveKitRoom: LKR, RoomAudioRenderer, useParticipants } = LKComponents;

  function Inner() {
    const participants = useParticipants();
    return (
      <div className="space-y-3">
        <RoomAudioRenderer />
        <div className="grid grid-cols-3 gap-3">
          {participants.slice(0, 9).map((p) => (
            <div key={p.identity} className="flex flex-col items-center gap-1.5">
              <Avatar className="h-10 w-10 border border-white/8">
                <AvatarFallback className="text-[10px] font-bold bg-white/4 text-white/50">
                  {p.name?.slice(0, 2).toUpperCase() ?? "??"}
                </AvatarFallback>
              </Avatar>
              <span className="text-[9px] text-white/35 truncate max-w-[60px]">{p.name ?? p.identity}</span>
            </div>
          ))}
        </div>
        <div className="text-center text-[9px] text-cyan-400/60">{participants.length} na sala</div>
      </div>
    );
  }

  return (
    <LKR serverUrl={wsUrl} token={token} connect onDisconnected={onDisconnect} options={{ disconnectOnPageLeave: true }}>
      <Inner />
    </LKR>
  );
}

/* ─── Tier 2: Demo participants grid ─── */
function DemoRoom({ participants }: { participants: Participant[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {participants.map((p) => (
        <div key={p.name} className="flex flex-col items-center gap-1.5">
          <div
            className={`relative rounded-full p-0.5 transition-shadow ${p.speaking ? "animate-voice-ring" : ""}`}
            style={p.speaking ? { boxShadow: `0 0 14px ${p.role === "dj" ? "#00ffcc" : "#ff00ff"}33` } : {}}
          >
            <Avatar className="h-10 w-10 border border-white/8">
              <AvatarFallback
                className={`text-[10px] font-bold ${
                  p.role === "dj"
                    ? "bg-cyan-900/40 text-cyan-300"
                    : p.role === "host"
                    ? "bg-fuchsia-900/40 text-fuchsia-300"
                    : "bg-white/4 text-white/50"
                }`}
              >
                {p.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {p.role === "host" && (
              <Crown className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 text-yellow-400" />
            )}
            {p.role === "dj" && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px]">🎧</span>
            )}
          </div>
          <span className="text-[9px] text-white/35 truncate max-w-[60px]">{p.name}</span>
          {p.muted && <MicOff className="h-2.5 w-2.5 text-red-400/50" />}
        </div>
      ))}
    </div>
  );
}

export default function VoiceRoom({ username }: { username?: string }) {
  const [mode, setMode] = useState<RoomMode>("loading");
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [mic, setMic] = useState(false);
  const [cam, setCam] = useState(false);

  const identity = username?.trim() || `guest_${Math.random().toString(36).slice(2, 7)}`;

  const fetchToken = useCallback(async () => {
    setMode("loading");
    try {
      const res = await fetch(`/api/livekit-token?identity=${encodeURIComponent(identity)}`);
      if (res.ok) {
        const data = (await res.json()) as TokenResponse;
        setTokenData(data);
        setMode(data.mode);
      } else {
        setMode("demo");
      }
    } catch {
      setMode("demo");
    }
  }, [identity]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const disconnect = useCallback(() => setMode("disconnected"), []);
  const reconnect = useCallback(() => fetchToken(), [fetchToken]);

  if (mode === "disconnected") {
    return (
      <div className="glassmorphism rounded-xl p-6 text-center">
        <p className="text-sm text-white/35">Desconectado da sala de voz</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-3 border-cyan-500/20 text-cyan-300/80 text-xs"
          onClick={reconnect}
        >
          Reconectar
        </Button>
      </div>
    );
  }

  return (
    <div className="glassmorphism rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4 text-cyan-400" />
          <span className="font-heading text-xs tracking-[0.15em] text-white/60">SALA DE VOZ</span>
        </div>
        <div className="flex items-center gap-2">
          {mode === "demo" && (
            <Badge className="border-none bg-yellow-500/10 text-[9px] text-yellow-400/70">DEMO</Badge>
          )}
          {mode === "livekit" && (
            <Badge className="border-none bg-green-500/15 text-[9px] text-green-400/80">AO VIVO</Badge>
          )}
          {mode === "loading" && (
            <Loader2 className="h-3 w-3 animate-spin text-cyan-400/50" />
          )}
          <Badge className="border-none bg-green-500/15 text-[9px] text-green-400/80">
            {DEMO_PARTICIPANTS.length} conectados
          </Badge>
        </div>
      </div>

      {/* Room content */}
      {mode === "loading" && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400/50" />
        </div>
      )}

      {mode === "livekit" && tokenData?.token && tokenData.wsUrl && (
        <LiveKitRoom token={tokenData.token} wsUrl={tokenData.wsUrl} onDisconnect={disconnect} />
      )}

      {mode === "demo" && <DemoRoom participants={DEMO_PARTICIPANTS} />}

      {/* Controls */}
      {mode !== "loading" && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            className={`h-8 w-8 rounded-full p-0 ${mic ? "text-cyan-400" : "text-white/35"}`}
            onClick={() => setMic(!mic)}
          >
            {mic ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`h-8 w-8 rounded-full p-0 ${cam ? "text-cyan-400" : "text-white/35"}`}
            onClick={() => setCam(!cam)}
          >
            {cam ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 w-8 rounded-full p-0"
            onClick={disconnect}
          >
            <PhoneOff className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
