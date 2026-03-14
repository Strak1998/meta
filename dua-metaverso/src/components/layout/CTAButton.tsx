"use client";

/**
 * Persistent floating CTA button — always visible during the concert.
 * Links directly to https://dua.2lados.pt for DUA 2.0 conversion.
 */
export default function CTAButton() {
  return (
    <a
      href="https://dua.2lados.pt"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-6 py-3 font-heading text-xs font-black tracking-[0.15em] text-white uppercase transition-transform hover:scale-105 active:scale-95 animate-cta-pulse"
      style={{
        background: "linear-gradient(135deg, #00ccaa 0%, #00ffcc 40%, #a855f6 70%, #ff00ff 100%)",
        backgroundSize: "200% 200%",
        animation: "cta-pulse 2s ease-in-out infinite, gradient-shift 4s ease-in-out infinite",
      }}
    >
      <span className="text-base">🚀</span>
      ENTRA NA DUA 2.0 AGORA
    </a>
  );
}
