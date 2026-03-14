"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Crown, Headphones, Wifi, WifiOff } from "lucide-react";

/*
  VoiceRoom — 3-tier graceful degradation:

  Tier 1 — LiveKit Cloud: real voice, participant tracking, speaking indicators.
           Requires NEXT_PUBLIC_LIVEKIT_URL + LIVEKIT_API_KEY + LIVEKIT_API_SECRET.

  Tier 2 — Demo mode (LiveKit not configured):
           UI reflects demo state with honest messaging.

  Tier 3 — Disconnected: reconnect button always available.

  To activate Tier 1, enable the LiveKit block below and install dependencies:
    npm install @livekit/components-react livekit-client
  (already in package.json — just needs the env vars)
*/

/* ─── LIVEKIT INTEGRATION (Tier 1) ─────────────────────────────────────────

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useTracks,
  ParticipantTile,
} from "@livekit/components-react";
import { Track } from "livekit-client";

function LiveKitVoiceRoom({ token, serverUrl }: { token: string; serverUrl: string }) {
  return (
    <LiveKitRoom serverUrl={serverUrl} token={token} connect audio>
      <RoomAudioRenderer />
      <LiveParticipantGrid />
    </LiveKitRoom>
  );
}

function LiveParticipantGrid() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  return (
    <div className="grid grid-cols-3 gap-3">
      {participants.map((p) => (
        <ParticipantTile key={p.identity} participant={p} />
      ))}
    </div>
  );
}

─────────────────────────────────────────────────────────────────────────── */

type ConnectionMode = "livekit" | "demo" | "disconnected";

interface MockParticipant {
  name: string;
  role: "dj" | "host" | "guest";
  speaking: boolean;
  muted: boolean;
}

const DEMO_PARTICIPANTS: MockParticipant[] = [
  { name: "DUA DJ", role: "dj", speaking: true, muted: false },
  { name: "Carlos (Host)", role: "host", speaking: false, muted: false },
  { name: "Maria", role: "guest", speaking: true, muted: false },
  { name: "João", role: "guest", speaking: false, muted: true },
  { name: "Ana", role: "guest", speaking: false, muted: false },
  { name: "Pedro", role: "guest", speaking: true, muted: false },
];

export default function VoiceRoom({
  username = "Convidado",
  isHost = false,
}: {
  username?: string;
  isHost?: boolean;
}) {
  const [mode, setMode] = useState<ConnectionMode>("demo");
  const [mic, setMic] = useState(false);
  const [cam, setCam] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  /* Attempt to connect to LiveKit on mount */
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_LIVEKIT_URL) return;

    let cancelled = false;

    async function fetchToken() {
      try {
        const res = await fetch("/api/livekit-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identity: username,
            name: username,
            role: isHost ? "host" : "guest",
          }),
        });

        if (cancelled) return;

        if (res.ok) {
          const data = await res.json() as { token: string; mode: string };
          if (data.mode === "livekit" && data.token) {
            setToken(data.token);
            setMode("livekit");
          }
        }
        /* If endpoint returns 503 (not configured), stays in demo mode — no error shown */
      } catch {
        /* Network failure — stays in demo mode silently */
      }
    }

    fetchToken();
    return () => { cancelled = true; };
  }, [username, isHost]);

  const disconnect = useCallback(() => setMode("disconnected"), []);
  const reconnect = useCallback(() => setMode("demo"), []);

  if (mode === "disconnected") {
    return (
      <div className="glassmorphism rounded-xl p-6 text-center space-y-3">
        <WifiOff className="h-6 w-6 mx-auto text-white/30" />
        <p className="text-sm text-white/35">Desconectado da sala de voz</p>
        <Button
          size="sm"
          variant="outline"
          className="border-cyan-500/20 text-cyan-300/80 text-xs"
          onClick={reconnect}
        >
          Reconectar
        </Button>
      </div>
    );
  }

  /*
    Tier 1: LiveKit active — render real participant grid.
    The block below swaps the demo grid for the real LiveKit component.
    Uncomment when ready to deploy with env vars.

    if (mode === "livekit" && token && process.env.NEXT_PUBLIC_LIVEKIT_URL) {
      return (
        <div className="glassmorphism rounded-xl p-4 space-y-4">
          <VoiceRoomHeader mode="livekit" participantCount={0} />
          <LiveKitVoiceRoom token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} />
          <VoiceControls mic={mic} cam={cam} onMic={() => setMic(!mic)} onCam={() => setCam(!cam)} onDisconnect={disconnect} />
        </div>
      );
    }
  */

  /* Tier 2: Demo mode */
  return (
    <div className="glassmorphism rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4 text-cyan-400" />
          <span className="font-heading text-xs tracking-[0.15em] text-white/60">
            SALA DE VOZ
          </span>
        </div>
        <div className="flex items-center gap-2">
          {mode === "livekit" ? (
            <Badge className="border-none bg-green-500/15 text-[9px] text-green-400/80 flex items-center gap-1">
              <Wifi className="h-2.5 w-2.5" /> AO VIVO
            </Badge>
          ) : (
            <Badge className="border-none bg-amber-500/10 text-[9px] text-amber-400/60">
              DEMO
            </Badge>
          )}
          <Badge className="border-none bg-white/5 text-[9px] text-white/40">
            {DEMO_PARTICIPANTS.length} conectados
          </Badge>
        </div>
      </div>

      {/* Participant grid */}
      <div className="grid grid-cols-3 gap-3">
        {DEMO_PARTICIPANTS.map((p) => (
          <div key={p.name} className="flex flex-col items-center gap-1.5">
            <div
              className={`relative rounded-full p-0.5 transition-shadow ${
                p.speaking ? "animate-voice-ring" : ""
              }`}
              style={
                p.speaking
                  ? {
                      boxShadow: `0 0 14px ${
                        p.role === "dj" ? "#00ffcc" : "#ff00ff"
                      }33`,
                    }
                  : {}
              }
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
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px]">
                  {"\uD83C\uDFA7"}
                </span>
              )}
            </div>
            <span className="text-[9px] text-white/35 truncate max-w-[60px]">
              {p.name}
            </span>
            {p.muted && <MicOff className="h-2.5 w-2.5 text-red-400/50" />}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <Button
          size="sm"
          variant="ghost"
          className={`h-8 w-8 rounded-full p-0 ${
            mic ? "text-cyan-400" : "text-white/35"
          }`}
          onClick={() => setMic(!mic)}
        >
          {mic ? (
            <Mic className="h-3.5 w-3.5" />
          ) : (
            <MicOff className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`h-8 w-8 rounded-full p-0 ${
            cam ? "text-cyan-400" : "text-white/35"
          }`}
          onClick={() => setCam(!cam)}
        >
          {cam ? (
            <Video className="h-3.5 w-3.5" />
          ) : (
            <VideoOff className="h-3.5 w-3.5" />
          )}
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
    </div>
  );
}
