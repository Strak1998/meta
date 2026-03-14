"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Users, CheckCheck } from "lucide-react";

export default function TopBar() {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 glassmorphism border-b border-white/4 sm:px-6">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="font-heading text-lg font-black tracking-wider text-gradient sm:text-xl">
          DUA
        </span>
        <Badge className="border-none bg-red-600/80 text-[9px] font-bold tracking-[0.2em] text-white animate-pulse">
          AO VIVO
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="hidden gap-1.5 text-xs text-white/50 hover:text-white sm:flex"
        >
          <Users className="h-3.5 w-3.5" /> Convidar DJ
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-cyan-500/20 text-xs text-cyan-300/80 hover:bg-cyan-500/8 hover:text-cyan-200"
          onClick={copyLink}
        >
          {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado!" : "Copiar Link"}
        </Button>
      </div>
    </nav>
  );
}
