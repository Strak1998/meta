"use client";

import { useRef, useEffect } from "react";

export default function WaveformVisualizer({ active = false }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anim = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const bars = 72;
    const draw = (time: number) => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const barW = w / bars - 1;
      for (let i = 0; i < bars; i++) {
        const intensity = active
          ? 0.25 + Math.abs(Math.sin(time * 0.003 + i * 0.3)) * 0.75 *
            Math.abs(Math.sin(time * 0.007 + i * 0.12)) *
            (0.6 + Math.abs(Math.cos(time * 0.002 + i * 0.5)) * 0.4)
          : 0.04 + Math.sin(time * 0.0008 + i * 0.18) * 0.025;
        const barH = intensity * h;
        const x = i * (barW + 1);

        const grad = ctx.createLinearGradient(0, h, 0, h - barH);
        grad.addColorStop(0, "rgba(0,255,204,0.85)");
        grad.addColorStop(0.4, "rgba(168,85,246,0.5)");
        grad.addColorStop(0.7, "rgba(255,0,255,0.3)");
        grad.addColorStop(1, "rgba(255,0,255,0.08)");
        ctx.fillStyle = grad;

        // Rounded top
        const radius = Math.min(barW / 2, 2);
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x, h - barH + radius);
        ctx.quadraticCurveTo(x, h - barH, x + radius, h - barH);
        ctx.lineTo(x + barW - radius, h - barH);
        ctx.quadraticCurveTo(x + barW, h - barH, x + barW, h - barH + radius);
        ctx.lineTo(x + barW, h);
        ctx.fill();
      }
      anim.current = requestAnimationFrame(draw);
    };
    anim.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(anim.current);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return (
    <div className="glassmorphism rounded-xl p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-heading text-[9px] tracking-[0.2em] text-white/25">WAVEFORM</span>
        {active && (
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] text-cyan-400/50">LIVE</span>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="h-18 w-full rounded-lg" />
    </div>
  );
}
