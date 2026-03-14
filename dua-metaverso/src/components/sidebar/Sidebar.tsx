"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Send, MessageCircle, ListMusic, Disc3, Zap,
  Play, Presentation, Mic2, Music, Sparkles, Crown,
} from "lucide-react";

type ConcertPhase =
  | "opening"
  | "dua2_presentation"
  | "vado_performance"
  | "uzzy_performance"
  | "estraca_performance"
  | "finale";

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  ts: number;
}

const REACTIONS = ["\uD83D\uDD25", "\u2764\uFE0F", "\uD83C\uDFB5", "\uD83C\uDF15", "\uD83D\uDC8E", "\uD83D\uDE80"];

/* Concert flow steps for HOST control */
const HOST_ACTIONS: {
  phase: ConcertPhase;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}[] = [
  {
    phase: "opening",
    label: "Start DJ Set",
    icon: <Play className="h-4 w-4" />,
    color: "#00ffcc",
    description: "DJ Avatar começa a misturar ao vivo",
  },
  {
    phase: "dua2_presentation",
    label: "Revelar DUA 2.0",
    icon: <Presentation className="h-4 w-4" />,
    color: "#a855f6",
    description: "Ecrã holográfico com +60 ferramentas",
  },
  {
    phase: "vado_performance",
    label: "Ativar VADO MKA",
    icon: <Mic2 className="h-4 w-4" />,
    color: "#ff6600",
    description: "Entrada cinematográfica pela esquerda",
  },
  {
    phase: "uzzy_performance",
    label: "Ativar UZZY",
    icon: <Music className="h-4 w-4" />,
    color: "#4488ff",
    description: "Entrada cinematográfica pela direita",
  },
  {
    phase: "estraca_performance",
    label: "Ativar ESTRACA",
    icon: <Sparkles className="h-4 w-4" />,
    color: "#ffd700",
    description: "Grande finale — entrada central",
  },
  {
    phase: "finale",
    label: "Finale & CTA",
    icon: <Crown className="h-4 w-4" />,
    color: "#ff00ff",
    description: "Todos no palco + CTA de conversão",
  },
];

export default function Sidebar({
  messages,
  onSend,
  onReaction,
  isHost,
  concertPhase,
  onPhaseChange,
  onTriggerConversion,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onReaction?: (emoji: string) => void;
  isHost?: boolean;
  concertPhase?: ConcertPhase;
  onPhaseChange?: (phase: ConcertPhase) => void;
  onTriggerConversion?: () => void;
}) {
  const [tab, setTab] = useState<"chat" | "queue" | "host">(isHost ? "host" : "chat");
  const [input, setInput] = useState("");
  const [djMode, setDjMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <aside className="glassmorphism flex h-full flex-col rounded-xl border border-white/4">
      {/* Tab bar */}
      <div className="flex border-b border-white/4">
        <button
          className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
            tab === "chat"
              ? "text-cyan-400 border-b border-cyan-400"
              : "text-white/35 hover:text-white/55"
          }`}
          onClick={() => setTab("chat")}
        >
          <MessageCircle className="mr-1 inline h-3.5 w-3.5" /> Chat
        </button>
        <button
          className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
            tab === "queue"
              ? "text-cyan-400 border-b border-cyan-400"
              : "text-white/35 hover:text-white/55"
          }`}
          onClick={() => setTab("queue")}
        >
          <ListMusic className="mr-1 inline h-3.5 w-3.5" /> Fila
        </button>
        {isHost && (
          <button
            className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
              tab === "host"
                ? "text-fuchsia-400 border-b border-fuchsia-400"
                : "text-white/35 hover:text-white/55"
            }`}
            onClick={() => setTab("host")}
          >
            <Crown className="mr-1 inline h-3.5 w-3.5" /> Host
          </button>
        )}
      </div>

      {/* ═══ CHAT TAB ═══ */}
      {tab === "chat" && (
        <>
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-2">
              {messages.map((m) => (
                <div key={m.id} className="text-xs animate-cinematic-in" style={{ animationDuration: "0.4s" }}>
                  <span className="font-semibold text-cyan-400/70">{m.user}: </span>
                  <span className="text-white/55">{m.text}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Reactions */}
          <div className="flex items-center gap-1 border-t border-white/4 px-3 py-1.5">
            {REACTIONS.map((e) => (
              <button
                key={e}
                className="rounded px-1.5 py-0.5 text-sm transition-transform hover:scale-125 active:scale-90"
                onClick={() => onReaction?.(e)}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-white/4 p-3">
            <input
              className="flex-1 rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-cyan-500/30 transition-colors"
              placeholder="Diz algo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <Button
              size="sm"
              className="h-8 w-8 rounded-full bg-cyan-500/15 p-0 text-cyan-400 hover:bg-cyan-500/25"
              onClick={send}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}

      {/* ═══ QUEUE TAB ═══ */}
      {tab === "queue" && (
        <ScrollArea className="flex-1 px-3 py-3">
          <div className="space-y-3">
            <div className="rounded-lg bg-cyan-500/4 border border-cyan-500/8 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Disc3 className="h-4 w-4 text-cyan-400 animate-spin-slow" />
                <span className="text-xs font-semibold text-cyan-300/90 tracking-wide">A TOCAR</span>
              </div>
              <p className="text-xs text-white/60">Lunar Groove — DUA ft. IA</p>
              <div className="flex items-center gap-2 text-[10px] text-white/25">
                <Zap className="h-3 w-3" /> 124 BPM • Afro-House
              </div>
            </div>
            {[
              "Morna da Lua — pedido de Maria",
              "Funana Beat — pedido de João",
              "Kizomba Neon — pedido de Ana",
            ].map((song, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-white/35 border border-white/4"
              >
                <span className="text-white/15 font-mono text-[10px]">{i + 1}</span>
                <span className="flex-1">{song}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* ═══ HOST CONTROL PANEL ═══ */}
      {tab === "host" && (
        <ScrollArea className="flex-1 px-3 py-3">
          <div className="space-y-3">
            {/* Host header */}
            <div className="rounded-lg bg-fuchsia-500/5 border border-fuchsia-500/15 p-3 text-center space-y-1">
              <p className="text-xs font-heading font-bold tracking-[0.2em] text-fuchsia-300/90">
                PAINEL DO HOST
              </p>
              <p className="text-[10px] text-white/30">
                Controlas tudo com cliques. Tu és o DJ do espetáculo.
              </p>
            </div>

            {/* Current phase indicator */}
            {concertPhase && (
              <div className="rounded-lg bg-white/3 border border-white/6 p-2.5 text-center">
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Fase atual</p>
                <p className="text-xs font-heading font-bold text-cyan-300 tracking-wide">
                  {HOST_ACTIONS.find((a) => a.phase === concertPhase)?.label ?? concertPhase}
                </p>
              </div>
            )}

            {/* Phase control buttons */}
            <div className="space-y-2">
              {HOST_ACTIONS.map((action) => {
                const isActive = concertPhase === action.phase;
                return (
                  <button
                    key={action.phase}
                    onClick={() => onPhaseChange?.(action.phase)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-all ${
                      isActive
                        ? "border-2 scale-[1.02] shadow-lg"
                        : "border border-white/6 hover:border-white/15 hover:bg-white/3"
                    }`}
                    style={
                      isActive
                        ? {
                            borderColor: action.color,
                            backgroundColor: action.color + "10",
                            boxShadow: `0 0 20px ${action.color}15`,
                          }
                        : undefined
                    }
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive ? "text-white" : "text-white/40"
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: action.color + "30", color: action.color }
                          : { backgroundColor: "rgba(255,255,255,0.04)" }
                      }
                    >
                      {action.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold tracking-wide ${
                          isActive ? "" : "text-white/60"
                        }`}
                        style={isActive ? { color: action.color } : undefined}
                      >
                        {action.label}
                      </p>
                      <p className="text-[10px] text-white/25 truncate">
                        {action.description}
                      </p>
                    </div>
                    {isActive && (
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span
                          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                          style={{ backgroundColor: action.color }}
                        />
                        <span
                          className="relative inline-flex h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: action.color }}
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="space-y-2 pt-2 border-t border-white/6">
              <p className="text-[10px] text-white/20 uppercase tracking-wider">Ações rápidas</p>
              <button
                onClick={() => onTriggerConversion?.()}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-600/20 to-fuchsia-600/20 border border-cyan-500/15 px-3 py-2.5 text-xs font-bold text-cyan-300 tracking-wide hover:from-cyan-600/30 hover:to-fuchsia-600/30 transition-all"
              >
                🚀 Mostrar CTA de Conversão
              </button>
              <a
                href="https://dua.2lados.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-white/3 border border-white/6 px-3 py-2.5 text-xs text-white/40 text-center hover:bg-white/5 transition-colors"
              >
                Abrir dua.2lados.pt (para demo)
              </a>
            </div>

            {/* Tips */}
            <div className="rounded-lg bg-amber-500/4 border border-amber-500/10 p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-amber-300/70 tracking-wide">💡 DICAS AO VIVO</p>
              <ul className="text-[10px] text-white/25 space-y-1 list-disc pl-3">
                <li>Fala pelo microfone (LiveKit)</li>
                <li>Clica em cada fase pela ordem</li>
                <li>Na fase DUA 2.0, faz demo ao vivo</li>
                <li>O CTA aparece automaticamente após cada artista</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      )}

      {/* DJ Mode toggle */}
      <div className="flex items-center justify-between border-t border-white/4 px-4 py-3">
        <span className="text-xs text-white/35">Modo DJ</span>
        <Switch checked={djMode} onCheckedChange={setDjMode} />
      </div>
    </aside>
  );
}
