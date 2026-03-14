"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Music } from "lucide-react";

export default function MusicModal({
  open,
  onOpenChange,
  onGenerate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onGenerate: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    onGenerate(prompt);
    setTimeout(() => {
      setGenerating(false);
      onOpenChange(false);
      setPrompt("");
    }, 2000);
  };

  const genres = [
    { label: "Afro-House", emoji: "\uD83C\uDF0D" },
    { label: "Kizomba", emoji: "\uD83D\uDC83" },
    { label: "Morna", emoji: "\uD83C\uDFB5" },
    { label: "Funana", emoji: "\uD83E\uDD41" },
    { label: "Trap", emoji: "\uD83D\uDD25" },
    { label: "Amapiano", emoji: "\uD83C\uDFB9" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism-strong border-white/8 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-xl tracking-wide">
            <Music className="h-5 w-5 text-cyan-400" />
            Pedir Música à DUA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm text-white/40 leading-relaxed">
            Descreve em Português ou Crioulo o que a DUA deve tocar. Ela gera ao vivo para ti.
          </p>

          <textarea
            className="w-full rounded-lg border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-500/30 transition-colors resize-none"
            rows={3}
            placeholder="Ex: Um beat afrohouse com melodia de morna cabo-verdiana..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <Badge
                key={g.label}
                variant="outline"
                className="cursor-pointer border-white/8 text-white/45 hover:border-cyan-500/25 hover:text-cyan-300 transition-all hover:scale-105 active:scale-95"
                onClick={() => setPrompt((p) => (p ? `${p}, ${g.label}` : g.label))}
              >
                {g.emoji} {g.label}
              </Badge>
            ))}
          </div>

          <Button
            className="w-full gap-2 font-heading text-sm font-bold tracking-wider text-white shadow-lg transition-all"
            style={{
              background: generating
                ? "linear-gradient(90deg, #00ffcc, #a855f6, #ff00ff)"
                : "linear-gradient(135deg, #00ccaa, #00ffcc, #a855f6, #ff00ff)",
              backgroundSize: generating ? "300% 100%" : "100% 100%",
              animation: generating ? "gradient-shift 1.5s linear infinite" : "none",
            }}
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
          >
            {generating ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" /> A GERAR...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> GERAR AGORA
              </>
            )}
          </Button>

          <p className="text-center text-[9px] text-white/15 tracking-wide">
            Powered by IA • Distribuição via KYNTAL
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
