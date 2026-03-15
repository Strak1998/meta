"use client";

import { useState } from "react";

interface TopBarProps {
  viewers?: number;
  isLive?: boolean;
}

export default function TopBar({ viewers = 0, isLive = true }: TopBarProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        borderBottom: "var(--glass-border)",
        boxShadow: "var(--glass-shadow)",
      }}
    >
      {/* Left: Logo + Label */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{
            fontFamily: "var(--font-orbitron), sans-serif",
            fontWeight: 900,
            fontSize: 18,
            color: "var(--accent-primary)",
            letterSpacing: "0.3em",
          }}
        >
          DUA
        </span>
        <span
          className="hidden-mobile-640"
          style={{
            width: 1,
            height: 16,
            background: "rgba(255,255,255,0.08)",
            margin: "0 16px",
            flexShrink: 0,
          }}
        />
        <span
          className="hidden-mobile-640"
          style={{
            fontFamily: "var(--font-orbitron), sans-serif",
            fontWeight: 400,
            fontSize: 9,
            color: "var(--text-muted)",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
          }}
        >
          METAVERSO DA LUA
        </span>
      </div>

      {/* Center: AO VIVO badge */}
      {isLive && (
        <span
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#dc2626",
            fontFamily: "var(--font-orbitron), sans-serif",
            fontWeight: 700,
            fontSize: 8,
            color: "#fff",
            letterSpacing: "0.35em",
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
            textTransform: "uppercase",
          }}
        >
          AO VIVO
        </span>
      )}

      {/* Right: Viewers + Copy Link */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "var(--radius-full)",
              background: "var(--accent-success)",
              boxShadow: "0 0 6px var(--accent-success)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-montserrat), sans-serif",
              fontWeight: 500,
              fontSize: 12,
              color: "var(--text-secondary)",
            }}
          >
            {viewers}
          </span>
        </div>
        <button
          onClick={copyLink}
          style={{
            fontFamily: "var(--font-orbitron), sans-serif",
            fontWeight: 400,
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: copied ? "var(--accent-primary)" : "var(--text-secondary)",
            background: "transparent",
            border: `1px solid ${copied ? "var(--border-active)" : "var(--border-default)"}`,
            borderRadius: "var(--radius-md)",
            padding: "6px 12px",
            cursor: "pointer",
            transition: "border-color var(--duration-base), color var(--duration-base)",
          }}
        >
          {copied ? "COPIADO" : "COPIAR LINK"}
        </button>
      </div>
    </nav>
  );
}
