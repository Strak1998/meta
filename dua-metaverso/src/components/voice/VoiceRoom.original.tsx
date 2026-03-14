"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Crown, Headphones } from "lucide-react";

/*
  VoiceRoom — ready for LiveKit integration.
  Replace the mock participants with real LiveKit room:

  import { LiveKitRoom, RoomAudioRenderer, ParticipantTile, useTracks } from "@livekit/components-react";
  import { Track } from "livekit-client";
  <LiveKitRoom serverUrl={LIVEKIT_URL} token={token} connect>
    <RoomAudioRenderer />
    {tracks.map(t => <ParticipantTile key={t.sid} trackRef={t} />)}
  </LiveKitRoom>
*/

interface Participant {
  name: string;
  role: "dj" | "host" | "guest";
  speaking: boolean;
  muted: boolean;
}

const MOCK_PARTICIPANTS: Participant[] = [
  { name: "DUA DJ", role: "dj", speaking: true, muted: false },
  { name: "Carlos (Host)", role: "host", speaking: false, muted: false },
  { name: "Maria", role: "guest", speaking: true, muted: false },
  { name: "João", role: "guest", speaking: false, muted: true },
  { name: "Ana", role: "guest", speaking: false, muted: false },
  { name: "Pedro", role: "guest", speaking: true, muted: false },
];

export default function VoiceRoom() {
  const [mic, setMic] = useState(false);
  const [cam, setCam] = useState(false);
  const [connected, setConnected] = useState(true);

  const disconnect = useCallback(() => setConnected(false), []);

  if (!connected) {
    return (
      <div className="glassmorphism rounded-xl p-6 text-center">
        <p className="text-sm text-white/35">Desconectado da sala de voz</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-3 border-cyan-500/20 text-cyan-300/80 text-xs"
          onClick={() => setConnected(true)}
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
        <Badge className="border-none bg-green-500/15 text-[9px] text-green-400/80">
          {MOCK_PARTICIPANTS.length} conectados
        </Badge>
      </div>

      {/* Participant grid */}
      <div className="grid grid-cols-3 gap-3">
        {MOCK_PARTICIPANTS.map((p) => (
          <div key={p.name} className="flex flex-col items-center gap-1.5">
            <div
              className={`relative rounded-full p-0.5 transition-shadow ${
                p.speaking ? "animate-voice-ring" : ""
              }`}
              style={
                p.speaking
                  ? { boxShadow: `0 0 14px ${p.role === "dj" ? "#00ffcc" : "#ff00ff"}33` }
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
    </div>
  );
}
