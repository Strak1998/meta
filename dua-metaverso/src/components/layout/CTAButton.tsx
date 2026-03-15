"use client";

import type { ConcertPhase } from "@/types/artist";

const PHASE_COPY: Record<ConcertPhase, string> = {
  opening: "ENTRA NA DUA 2.0 AGORA",
  dua2_presentation: "EXPERIMENTA A DUA 2.0",
  vado_performance: "MUSICA COM IA — DUA 2.0",
  uzzy_performance: "CRIA BEATS COM DUA 2.0",
  estraca_performance: "ENTRA NA DUA 2.0 JA",
  finale: "JUNTA-TE A DUA 2.0",
};

function track(phase: ConcertPhase) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "cta_click", phase }),
  }).catch(() => {});
}

export default function CTAButton({ concertPhase = "opening" }: { concertPhase?: ConcertPhase }) {
  const text = PHASE_COPY[concertPhase];
  return (
    <>
      <style>{`
        @keyframes ctaScale { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.02); } }
      `}</style>
      <a
        href="https://dua.2lados.pt"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track(concertPhase)}
        data-cta-button=""
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 50,
          padding: "14px 24px",
          borderRadius: "var(--radius-sm)",
          background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
          fontFamily: "var(--font-orbitron, Orbitron, sans-serif)",
          fontWeight: 900,
          fontSize: 10,
          letterSpacing: "0.25em",
          color: "var(--bg-base)",
          textDecoration: "none",
          textTransform: "uppercase",
          animation: "ctaScale 3s ease-in-out infinite",
          textAlign: "center",
        }}
      >
        {text}
      </a>
    </>
  );
}
