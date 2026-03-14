"use client";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 text-[9px] text-white/15 sm:px-6">
      <span>2025 DUA Metaverso da Lua</span>
      <div className="flex items-center gap-3">
        <a
          href="https://dua.2lados.pt"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400/30 hover:text-cyan-400/60 transition-colors"
        >
          DUA 2.0 — +60 ferramentas IA
        </a>
        <span className="hidden sm:inline opacity-50">|</span>
        <span className="hidden sm:inline">Next.js + Three.js + LiveKit</span>
        <span className="hidden sm:inline opacity-50">|</span>
        <span className="hidden sm:inline">KYNTAL</span>
      </div>
    </footer>
  );
}
