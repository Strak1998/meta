"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

type ConcertPhase =
  | "opening"
  | "dua2_presentation"
  | "vado_performance"
  | "uzzy_performance"
  | "estraca_performance"
  | "finale";

const PHASE_LABELS: Record<ConcertPhase, { title: string; subtitle: string; color: string }> = {
  opening: {
    title: "DUA METAVERSO DA LUA",
    subtitle: "DJ Avatar IA ao vivo no metaverso lunar",
    color: "#00ffcc",
  },
  dua2_presentation: {
    title: "DUA 2.0",
    subtitle: "A Primeira IA Lusofona com Identidade Propria, Rosto e Voz",
    color: "#00ffcc",
  },
  vado_performance: {
    title: "VADO MKA",
    subtitle: "Performance especial ao vivo",
    color: "#ff6600",
  },
  uzzy_performance: {
    title: "UZZY",
    subtitle: "Performance especial ao vivo",
    color: "#4488ff",
  },
  estraca_performance: {
    title: "ESTRACA",
    subtitle: "Grande finale — performance de encerramento",
    color: "#ffd700",
  },
  finale: {
    title: "DUA 2.0",
    subtitle: "+60 ferramentas de IA em Portugues e Crioulo — dua.2lados.pt",
    color: "#00ffcc",
  },
};

export default function HeroOverlay({
  viewerCount,
  concertPhase,
  musicGenerated,
}: {
  viewerCount: number;
  concertPhase: ConcertPhase;
  musicGenerated: boolean;
}) {
  const [fadeIn, setFadeIn] = useState(false);
  const [phaseKey, setPhaseKey] = useState(concertPhase);

  useEffect(() => {
    requestAnimationFrame(() => setFadeIn(true));
  }, []);

  /* Trigger re-animation on phase change */
  useEffect(() => {
    setPhaseKey(concertPhase);
  }, [concertPhase]);

  const phaseInfo = PHASE_LABELS[phaseKey];
  const isDUA2 = phaseKey === "dua2_presentation" || phaseKey === "finale";
  const isArtist = phaseKey === "vado_performance" || phaseKey === "uzzy_performance" || phaseKey === "estraca_performance";

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-4 transition-opacity duration-[2500ms] ${
        fadeIn ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Cinematic radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-radial from-cyan-500/6 via-transparent to-transparent blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-radial from-fuchsia-500/4 via-transparent to-transparent blur-3xl animate-breathe" />

      {/* Live badge */}
      <Badge className="mb-8 border-none bg-red-600/90 px-6 py-1.5 text-sm font-bold tracking-[0.25em] text-white shadow-lg shadow-red-500/30 animate-pulse">
        AO VIVO
      </Badge>

      {/* Phase indicator */}
      {isArtist && (
        <div
          key={`artist-${phaseKey}`}
          className="mb-4 animate-epic-entrance"
        >
          <Badge
            className="border-none px-5 py-1 text-xs font-bold tracking-[0.3em] text-white"
            style={{ backgroundColor: phaseInfo.color + "40" }}
          >
            🎤 PERFORMANCE AO VIVO
          </Badge>
        </div>
      )}

      {/* Main title — changes per phase */}
      <div key={`title-${phaseKey}`} className="animate-phase-in">
        <h1
          className="text-3d-premium mb-3 text-center font-heading text-4xl font-black uppercase tracking-[0.2em] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
          style={isArtist ? {
            background: `linear-gradient(175deg, #ffffff 0%, ${phaseInfo.color}80 50%, ${phaseInfo.color} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          } : undefined}
        >
          {phaseInfo.title}
        </h1>
      </div>

      {/* DUA 2.0 highlight content during presentation */}
      {isDUA2 && (
        <div key={`dua2-${phaseKey}`} className="animate-slide-up max-w-xl text-center space-y-3 mb-6">
          <p className="text-sm text-cyan-300/80 font-semibold tracking-wider">
            A Primeira IA Lusofona com Identidade Propria, Rosto e Voz
          </p>
          <p className="text-xs text-white/50">
            +60 ferramentas: Musica • Imagem • Video • Design • Backstage • Gestao de Carreira
          </p>
          <div className="inline-block rounded-lg bg-amber-500/8 border border-amber-500/20 px-4 py-2">
            <p className="text-xs text-amber-300/90 font-semibold">
              🇨🇻 🇬🇼 A PRIMEIRA IA DO MUNDO que fala crioulo nativo
            </p>
          </div>
        </div>
      )}

      {/* Subtitle (non-DUA2 phases) */}
      {!isDUA2 && (
        <p
          key={`sub-${phaseKey}`}
          className="mb-8 max-w-lg text-center text-sm text-white/40 sm:text-base leading-relaxed animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          {phaseInfo.subtitle}
        </p>
      )}

      {/* Decorative lines */}
      <div className="mb-6 flex items-center gap-4 animate-cinematic-in" style={{ animationDelay: "0.4s" }}>
        <span className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-400/40" />
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70 animate-pulse-glow" />
        <span className="h-px w-8 bg-cyan-400/20" />
        <span className="h-1 w-1 rounded-full bg-fuchsia-400/50" />
        <span className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-400/40" />
      </div>

      {/* Viewer count */}
      <div className="glassmorphism flex items-center gap-3 rounded-full px-7 py-2.5 text-xs font-semibold tracking-wide animate-cinematic-in" style={{ animationDelay: "0.6s" }}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
        </span>
        <span className="text-cyan-300">{viewerCount.toLocaleString("pt-PT")} espectadores</span>
      </div>

      {/* Concert flow indicator */}
      <div className="mt-6 flex items-center gap-1.5 animate-cinematic-in" style={{ animationDelay: "0.8s" }}>
        {["opening", "dua2_presentation", "vado_performance", "uzzy_performance", "estraca_performance", "finale"].map((p) => (
          <div
            key={p}
            className={`h-1.5 rounded-full transition-all duration-700 ${
              p === phaseKey ? "w-6 bg-cyan-400" : "w-1.5 bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Scroll indicator on opening */}
      {phaseKey === "opening" && (
        <div className="absolute bottom-14 flex flex-col items-center gap-2 animate-cinematic-in" style={{ animationDelay: "1.5s" }}>
          <span className="text-[9px] tracking-[0.3em] text-white/15 uppercase">scroll</span>
          <div className="h-9 w-[1px] bg-gradient-to-b from-cyan-400/25 to-transparent animate-bounce" />
        </div>
      )}
    </div>
  );
}
