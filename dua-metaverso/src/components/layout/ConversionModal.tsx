"use client";

import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

async function track(event: string) {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, phase: "modal" }),
    });
  } catch {
    /* fire-and-forget */
  }
}

/**
 * ConversionModal — appears after DUA 2.0 presentation and after each artist performance.
 * Drives traffic to https://dua.2lados.pt with a strong CTA.
 */
export default function ConversionModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  useEffect(() => {
    if (open) track("modal_open");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism-strong border-cyan-500/15 text-white sm:max-w-md p-0 overflow-hidden">
        {/* Holographic top accent */}
        <div
          className="h-1.5 w-full"
          style={{
            background: "linear-gradient(90deg, #00ffcc, #a855f6, #ff00ff, #00ffcc)",
            backgroundSize: "300% 100%",
            animation: "gradient-shift 3s linear infinite",
          }}
        />

        <div className="px-6 py-6 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-4xl">🤖</span>
            <h2 className="font-heading text-xl font-black tracking-wider text-gradient-hero">
              DUA 2.0
            </h2>
            <p className="text-xs text-cyan-300/60 tracking-widest uppercase font-heading">
              A Primeira IA Lusófona
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-2.5">
            <p className="text-sm text-white/70 leading-relaxed text-center">
              Testa já as <span className="text-cyan-300 font-bold">+60 ferramentas</span> da DUA 2.0:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
              {[
                { emoji: "🎵", label: "Música com IA" },
                { emoji: "🎨", label: "Imagem & Design" },
                { emoji: "🎬", label: "Vídeo & Edição" },
                { emoji: "📊", label: "Gestão de Carreira" },
                { emoji: "🎤", label: "Backstage Tools" },
                { emoji: "🌍", label: "Fala Crioulo!" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-lg bg-white/3 border border-white/5 px-3 py-2"
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Crioulo highlight */}
          <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/15 p-3 text-center">
            <p className="text-xs text-cyan-300/80 font-semibold">
              🇨🇻 A PRIMEIRA IA DO MUNDO que fala crioulo nativo de Cabo Verde e Guiné-Bissau
            </p>
          </div>

          {/* CTA Button */}
          <a
            href="https://dua.2lados.pt"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("modal_convert")}
            className="block w-full rounded-xl py-3.5 text-center font-heading text-sm font-black tracking-[0.2em] text-white uppercase transition-transform hover:scale-[1.02] active:scale-95"
            style={{
              background: "linear-gradient(135deg, #00ccaa, #00ffcc, #a855f6, #ff00ff)",
            }}
          >
            EXPERIMENTAR GRÁTIS AGORA
          </a>

          {/* Dismiss */}
          <button
            className="w-full text-center text-[10px] text-white/20 hover:text-white/40 transition-colors tracking-wide"
            onClick={() => { track("modal_dismiss"); onOpenChange(false); }}
          >
            Continuar a ver o concerto →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
