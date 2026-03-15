"use client";

import type { ConcertPhase } from "@/types/artist";

/*
  CTAButton — persistent floating conversion button.
  Copy changes per concert phase to stay contextually relevant.
  Each click fires a fire-and-forget track event to /api/track.
*/

const PHASE_COPY: Record<ConcertPhase, { emoji: string; text: string }> = {
  opening: { emoji: "🚀", text: "ENTRA NA DUA 2.0 AGORA" },
  dua2_presentation: { emoji: "🤖", text: "EXPERIMENTA A DUA 2.0 GRÁTIS" },
  vado_performance: { emoji: "🎤", text: "MÚSICA COM IA — DUA 2.0" },
  uzzy_performance: { emoji: "🎵", text: "CRIA BEATS COM DUA 2.0" },
  estraca_performance: { emoji: "🔥", text: "ENTRA NA DUA 2.0 JÁ" },
  finale: { emoji: "⭐", text: "JUNTA-TE À DUA 2.0" },
};

function track(phase: ConcertPhase) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "cta_click", phase }),
  }).catch(() => {});
}

export default function CTAButton({ concertPhase = "opening" }: { concertPhase?: ConcertPhase }) {
  const { emoji, text } = PHASE_COPY[concertPhase];
  return (
    <a
      href="https://dua.2lados.pt"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track(concertPhase)}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 font-heading text-[10px] font-black tracking-[0.15em] text-white uppercase interactive sm:bottom-6 sm:right-6 sm:px-6 sm:py-3 sm:text-xs"
      style={{
        minHeight: "var(--touch-min)",
        background: "linear-gradient(135deg, #00ccaa 0%, #00ffcc 40%, #a855f6 70%, #ff00ff 100%)",
        backgroundSize: "200% 200%",
        animation: "cta-pulse 2s ease-in-out infinite, gradient-shift 4s ease-in-out infinite",
      }}
    >
      <span className="text-base">{emoji}</span>
      <span className="hidden sm:inline">{text}</span>
      <span className="sm:hidden">DUA 2.0</span>
    </a>
  );
}
