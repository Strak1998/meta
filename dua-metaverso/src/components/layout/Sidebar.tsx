"use client";

import { MessageSquare, Users as UsersIcon, Send, ListMusic, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ConcertPhase } from "@/types/artist";

interface SidebarProps {
  messages: { id: string; user: string; text: string; ts: number }[];
  onSend: (text: string) => Promise<void>;
  onReaction: (emoji: string) => Promise<void>;
  isHost: boolean;
  concertPhase: ConcertPhase;
  onPhaseChange: (phase: ConcertPhase) => void;
  onTriggerConversion: () => void;
}

const PHASES: { id: ConcertPhase; label: string }[] = [
  { id: "opening", label: "Abertura" },
  { id: "dua2_presentation", label: "DUA 2.0" },
  { id: "vado_performance", label: "Vado MKA" },
  { id: "uzzy_performance", label: "Uzzy" },
  { id: "estraca_performance", label: "Estraca" },
  { id: "finale", label: "Finale" },
];

export default function Sidebar({
  messages,
  onSend,
  onReaction,
  isHost,
  concertPhase,
  onPhaseChange,
  onTriggerConversion,
}: SidebarProps) {
  const [inputMsg, setInputMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "queue" | "host">("chat");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    onSend(inputMsg);
    setInputMsg("");
  };

  return (
    <aside className="flex h-full flex-col rounded-xl border border-cyan-400/10 bg-black/60 backdrop-blur-md">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-cyan-400/10 p-2">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 rounded px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === "chat" ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:bg-white/5"}`}
        >
          <MessageSquare className="mx-auto mb-0.5 h-3.5 w-3.5" /> Chat
        </button>
        <button
          onClick={() => setActiveTab("queue")}
          className={`flex-1 rounded px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === "queue" ? "bg-purple-500/20 text-purple-400" : "text-white/40 hover:bg-white/5"}`}
        >
          <ListMusic className="mx-auto mb-0.5 h-3.5 w-3.5" /> Fila
        </button>
        {isHost && (
          <button
            onClick={() => setActiveTab("host")}
            className={`flex-1 rounded px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === "host" ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:bg-white/5"}`}
          >
            <Shield className="mx-auto mb-0.5 h-3.5 w-3.5" /> Host
          </button>
        )}
      </div>

      {/* Chat tab */}
      {activeTab === "chat" && (
        <>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="mr-1.5 font-bold text-cyan-300">{msg.user}:</span>
                  <span className="text-white/80">{msg.text}</span>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center pt-10 text-center opacity-30">
                  <MessageSquare className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-xs">O chat esta silencioso.<br />Se o primeiro a falar.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="space-y-2.5 border-t border-cyan-400/10 bg-black/40 p-3">
            <div className="flex justify-center gap-2">
              {["\uD83D\uDC4F", "\uD83D\uDD25", "\uD83D\uDE80", "\uD83C\uDFB8"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReaction(emoji)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-base transition hover:bg-cyan-400/20"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="flex gap-2">
              <Input
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Envia uma mensagem..."
                className="h-10 border-cyan-400/20 bg-black/50 text-sm text-white placeholder:text-white/20 focus-visible:ring-cyan-400/50"
              />
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,255,204,0.3)] hover:bg-cyan-400"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </>
      )}

      {/* Queue tab */}
      {activeTab === "queue" && (
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-4 text-center">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-purple-400/70">A tocar agora</p>
            <p className="mb-2 font-bold text-white">DUA - Rap Cosmico IA</p>
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
              </span>
              <span className="font-mono text-xs text-purple-300">128 BPM</span>
            </div>
          </div>

          <p className="mt-4 text-xs uppercase tracking-widest text-white/40">Proximas na fila</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded bg-white/5 border border-white/10 p-3">
              <div>
                <p className="text-sm font-medium text-white/90">Crioulo Drill 2026</p>
                <p className="text-[10px] text-cyan-400">Pedida por: Carlos</p>
              </div>
              <span className="text-xs text-white/30">2:14</span>
            </div>
            <div className="flex items-center justify-between rounded bg-white/5 border border-white/10 p-3 opacity-50">
              <div>
                <p className="text-sm font-medium text-white/90">Kizomba Espacial</p>
                <p className="text-[10px] text-cyan-400">Pedida por: Maria</p>
              </div>
              <span className="text-xs text-white/30">3:30</span>
            </div>
          </div>
        </div>
      )}

      {/* Host tab */}
      {activeTab === "host" && isHost && (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <p className="text-[10px] uppercase tracking-widest text-amber-400/70">Maestro de Fases</p>
          <div className="grid grid-cols-2 gap-2">
            {PHASES.map((p) => (
              <button
                key={p.id}
                onClick={() => onPhaseChange(p.id)}
                className={`rounded px-2 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  concertPhase === p.id
                    ? "border border-amber-400 bg-amber-400/20 text-amber-300"
                    : "border border-white/8 bg-white/4 text-white/50 hover:bg-white/8"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-4 border-t border-white/8 pt-4">
            <button
              onClick={onTriggerConversion}
              className="w-full rounded bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:opacity-90"
            >
              Activar Modal de Conversao
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
