"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  delay: number;
}

export default function ReactionsOverlay() {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
  const counter = useRef(0);

  const addReaction = useCallback((emoji: string) => {
    const id = counter.current++;
    const x = 8 + Math.random() * 84;
    const delay = Math.random() * 0.2;
    setEmojis((prev) => [...prev.slice(-25), { id, emoji, x, delay }]);
    setTimeout(() => setEmojis((prev) => prev.filter((e) => e.id !== id)), 3800);
  }, []);

  useEffect(() => {
    const pool = ["\uD83D\uDD25", "\u2764\uFE0F", "\uD83C\uDFB5", "\uD83C\uDF15", "\uD83D\uDC8E", "\uD83D\uDE80", "\u2728", "\uD83C\uDFA7"];
    const iv = setInterval(() => {
      if (Math.random() > 0.65) {
        addReaction(pool[Math.floor(Math.random() * pool.length)]);
      }
    }, 2200);
    return () => clearInterval(iv);
  }, [addReaction]);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {emojis.map((e) => (
        <span
          key={e.id}
          className="absolute text-2xl animate-float-emoji"
          style={{
            left: `${e.x}%`,
            bottom: "-40px",
            animationDelay: `${e.delay}s`,
          }}
        >
          {e.emoji}
        </span>
      ))}
    </div>
  );
}
