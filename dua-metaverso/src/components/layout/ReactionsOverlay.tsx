"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface FloatingReaction {
  id: number;
  text: string;
  color: string;
  x: number;
  delay: number;
}

const REACTION_COLORS: Record<string, string> = {
  FOGO: "#ff4400",
  AMOR: "#ff69b4",
  LUA: "#c084fc",
  NOTA: "#fbbf24",
};

export default function ReactionsOverlay() {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const counter = useRef(0);

  const addReaction = useCallback((text: string) => {
    const id = counter.current++;
    const x = 8 + Math.random() * 84;
    const delay = Math.random() * 0.2;
    const color = REACTION_COLORS[text] || "#00ffcc";
    setReactions((prev) => [...prev.slice(-10), { id, text, color, x, delay }]);
    setTimeout(() => setReactions((prev) => prev.filter((e) => e.id !== id)), 1500);
  }, []);

  useEffect(() => {
    const pool = ["FOGO", "AMOR", "LUA", "NOTA"];
    const iv = setInterval(() => {
      if (Math.random() > 0.65) {
        addReaction(pool[Math.floor(Math.random() * pool.length)]);
      }
    }, 2200);
    return () => clearInterval(iv);
  }, [addReaction]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 30, overflow: "hidden", pointerEvents: "none" }}>
      {reactions.map((r) => (
        <span
          key={r.id}
          className="absolute animate-float-emoji"
          style={{
            left: `${r.x}%`,
            bottom: "-40px",
            animationDelay: `${r.delay}s`,
            color: r.color,
            fontFamily: "var(--font-orbitron, Orbitron, sans-serif)",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "3px",
            textShadow: `0 0 10px ${r.color}66`,
          }}
        >
          {r.text}
        </span>
      ))}
    </div>
  );
}
