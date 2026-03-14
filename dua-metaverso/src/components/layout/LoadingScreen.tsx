"use client";

import { useState, useEffect } from "react";

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("Inicializando WebGL...");

  useEffect(() => {
    const phases = [
      { at: 10, text: "Carregando texturas de alta resolucao..." },
      { at: 22, text: "Gerando avatar DJ DUA com IA..." },
      { at: 38, text: "Preparando palco holografico..." },
      { at: 50, text: "Renderizando iluminacao cinematica..." },
      { at: 62, text: "Conectando DUA 2.0 — +60 ferramentas IA..." },
      { at: 74, text: "Carregando avatares VADO MKA, UZZY, ESTRACA..." },
      { at: 85, text: "Sincronizando audio espacial..." },
      { at: 93, text: "Conectando ao metaverso lunar..." },
    ];
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setTimeout(onComplete, 500);
          return 100;
        }
        const next = p + (Math.random() * 2.2 + 0.6);
        const ph = phases.findLast((x) => next >= x.at);
        if (ph) setPhase(ph.text);
        return next;
      });
    }, 45);
    return () => clearInterval(id);
  }, [onComplete]);

  const pct = Math.floor(Math.min(progress, 100));

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020204] overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: `${1.5 + (i % 3)}px`,
              height: `${1.5 + (i % 3)}px`,
              left: `${(i * 2.1) % 100}%`,
              top: `${(i * 3.3) % 100}%`,
              animationDelay: `${(i * 0.18) % 4.5}s`,
              animationDuration: `${3 + (i % 4)}s`,
              background: i % 5 === 0 ? "rgba(255,0,255,0.08)" : "rgba(0,255,204,0.08)",
            }}
          />
        ))}
      </div>

      {/* Spinning rings */}
      <div className="relative mb-16 h-48 w-48">
        <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-cyan-400/12 shadow-[0_0_80px_rgba(0,255,204,0.1)]" />
        <div className="absolute inset-3 animate-reverse-spin rounded-full border border-fuchsia-500/10 shadow-[0_0_50px_rgba(255,0,255,0.06)]" />
        <div className="absolute inset-6 animate-spin-slow rounded-full border border-cyan-500/6" style={{ animationDuration: "14s" }} />
        <div className="absolute inset-9 animate-reverse-spin rounded-full border border-fuchsia-400/5" style={{ animationDuration: "18s" }} />
        <div className="absolute inset-12 animate-spin-slow rounded-full border border-amber-400/4" style={{ animationDuration: "22s" }} />

        {/* Center logo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-5xl font-black text-gradient">DUA</span>
          <span className="font-heading text-[9px] tracking-[0.5em] text-white/25 mt-1.5">METAVERSO</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-72 sm:w-96">
        <div className="mb-2.5 h-[2px] overflow-hidden rounded-full bg-white/4">
          <div
            className="h-full rounded-full transition-all duration-150 ease-out"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #00ffcc, #a855f6, #ff00ff, #00ffcc)",
              backgroundSize: "300% 100%",
              animation: "gradient-shift 2.5s linear infinite",
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/25 tracking-wide">{phase}</span>
          <span className="font-heading text-cyan-400/50 tabular-nums">{pct}%</span>
        </div>
      </div>

      {/* Concert lineup */}
      <div className="mt-10 flex items-center gap-3 text-[9px] text-white/15 tracking-wider">
        <span>DJ DUA</span>
        <span className="text-cyan-400/30">→</span>
        <span>DUA 2.0</span>
        <span className="text-cyan-400/30">→</span>
        <span>VADO MKA</span>
        <span className="text-cyan-400/30">→</span>
        <span>UZZY</span>
        <span className="text-cyan-400/30">→</span>
        <span>ESTRACA</span>
      </div>

      <p className="mt-4 text-center text-[9px] text-white/8 tracking-[0.25em] uppercase">
        Primeiro concerto com DJ Avatar IA ao vivo no metaverso
      </p>
    </div>
  );
}
