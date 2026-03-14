"use client";

import { useCallback } from "react";

type ConcertPhase =
  | "opening"
  | "dua2_presentation"
  | "vado_performance"
  | "uzzy_performance"
  | "estraca_performance"
  | "finale";

/*
  Copy changes with the emotional moment:
  - opening: curiosity / invitation
  - dua2_presentation: direct product CTA at peak attention
  - artist performances: artist-specific urgency
  - finale: final conversion push with maximum urgency
*/
const CTA_COPY: Record<ConcertPhase, string> = {
  opening: "ENTRA NA DUA 2.0",
  dua2_presentation: "EXPERIMENTA AGORA — GRATIS",
  vado_performance: "CRIA MUSICA COM IA",
  uzzy_performance: "CRIA MUSICA COM IA",
  estraca_performance: "CRIA MUSICA COM IA",
  finale: "JUNTA-TE A NOS — GRATIS",
};

async function track(event: string, phase: string) {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, phase }),
    });
  } catch {
    /* Tracking is fire-and-forget — never block the user */
  }
}

export default function CTAButton({
  concertPhase = "opening",
}: {
  concertPhase?: ConcertPhase;
}) {
  const copy = CTA_COPY[concertPhase];

  const handleClick = useCallback(() => {
    track("cta_click", concertPhase);
  }, [concertPhase]);

  return (
    <a
      href="https://dua.2lados.pt"
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-6 py-3 font-heading text-xs font-black tracking-[0.15em] text-white uppercase transition-transform hover:scale-105 active:scale-95"
      style={{
        background:
          "linear-gradient(135deg, #00ccaa 0%, #00ffcc 40%, #a855f6 70%, #ff00ff 100%)",
        backgroundSize: "200% 200%",
        animation:
          "cta-pulse 2s ease-in-out infinite, gradient-shift 4s ease-in-out infinite",
      }}
    >
      <span className="text-base">🚀</span>
      {copy}
    </a>
  );
}
