"use client";

import { useState } from "react";
import type { ArtistSlot, StagePosition } from "@/types/artist";

interface ArtistCardProps {
  slot: ArtistSlot;
  onEnter: (artistId: string, position: StagePosition) => void;
  onExit: (artistId: string) => void;
  onSpotlight: (artistId: string) => void;
  onUpdate: (artistId: string, updates: Partial<ArtistSlot>) => void;
  onRevealName: (artistId: string) => void;
}

const STATUS_COLORS: Record<ArtistSlot["status"], string> = {
  aguarda: "#888",
  pronto: "#f39c12",
  em_palco: "#00ffcc",
  saiu: "#444",
};

const STATUS_LABELS: Record<ArtistSlot["status"], string> = {
  aguarda: "AGUARDA",
  pronto: "PRONTO",
  em_palco: "EM PALCO",
  saiu: "SAIU",
};

export function ArtistCard({
  slot,
  onEnter,
  onExit,
  onSpotlight,
  onUpdate,
  onRevealName,
}: ArtistCardProps) {
  const [position, setPosition] = useState<StagePosition>(slot.defaultPosition);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(slot.name);
  const [draftColor, setDraftColor] = useState(slot.accentColor);

  const isEmpty = !slot.name.trim();
  const isOnStage = slot.status === "em_palco";

  if (isEmpty && !editing) {
    return (
      <div
        style={{
          border: "1px dashed rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minHeight: 180,
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}
        onClick={() => setEditing(true)}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,204,0.3)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)")}
      >
        <div style={{ fontSize: 24, color: "#444" }}>+</div>
        <div style={{ fontSize: 10, color: "#555", letterSpacing: 2 }}>ADD ARTISTA</div>
      </div>
    );
  }

  if (editing) {
    return (
      <div
        style={{
          border: `1px solid ${draftColor}66`,
          borderRadius: 12,
          padding: 20,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 10, color: "#888", letterSpacing: 2, marginBottom: 4 }}>
          CONFIGURAR ARTISTA — {slot.id.toUpperCase()}
        </div>
        <input
          autoFocus
          placeholder="Nome do artista"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          style={inputStyle}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 10, color: "#666", letterSpacing: 1, whiteSpace: "nowrap" }}>COR:</label>
          <input
            type="color"
            value={draftColor}
            onChange={(e) => setDraftColor(e.target.value)}
            style={{ width: 40, height: 32, border: "none", background: "none", cursor: "pointer" }}
          />
          <div style={{ fontSize: 12, color: draftColor, fontFamily: "monospace" }}>{draftColor}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              onUpdate(slot.id, { name: draftName.trim(), accentColor: draftColor });
              setEditing(false);
            }}
            disabled={!draftName.trim()}
            style={{ ...btnStyle, background: "#00ffcc", color: "#030305", flex: 1 }}
          >
            GUARDAR
          </button>
          <button onClick={() => setEditing(false)} style={{ ...btnStyle, background: "transparent", border: "1px solid #444", flex: 1 }}>
            CANCELAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        border: `1px solid ${slot.accentColor}44`,
        borderRadius: 12,
        padding: 20,
        background: isOnStage ? `${slot.accentColor}0a` : "rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        transition: "border-color 0.3s, background 0.3s",
      }}
    >
      {isOnStage && (
        <div
          style={{
            position: "absolute",
            top: -1,
            left: 0,
            right: 0,
            height: 2,
            background: slot.accentColor,
            borderRadius: "12px 12px 0 0",
            boxShadow: `0 0 12px ${slot.accentColor}`,
          }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: STATUS_COLORS[slot.status],
                boxShadow: isOnStage ? `0 0 8px ${slot.accentColor}` : undefined,
              }}
            />
            <div style={{ fontSize: 10, color: STATUS_COLORS[slot.status], letterSpacing: 2 }}>
              {STATUS_LABELS[slot.status]}
            </div>
          </div>
          <div style={{ fontSize: 16, color: slot.accentColor, fontWeight: 700, letterSpacing: 1 }}>
            {slot.name}
          </div>
          {slot.bio && <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{slot.bio}</div>}
        </div>

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: slot.accentColor + "33",
            border: `2px solid ${slot.accentColor}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {slot.name.charAt(0).toUpperCase()}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {(["esquerda", "centro", "direita"] as StagePosition[]).map((p) => (
          <button
            key={p}
            onClick={() => setPosition(p)}
            style={{
              flex: 1,
              padding: "6px 0",
              fontSize: 9,
              letterSpacing: 1,
              background: position === p ? slot.accentColor + "33" : "transparent",
              border: `1px solid ${position === p ? slot.accentColor : "#333"}`,
              borderRadius: 6,
              color: position === p ? slot.accentColor : "#555",
              cursor: "pointer",
            }}
          >
            {p === "esquerda" ? "ESQ" : p === "centro" ? "CTR" : "DIR"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {!isOnStage && slot.status !== "saiu" && (
          <button
            onClick={() => onRevealName(slot.id)}
            style={{ ...btnStyle, background: slot.accentColor + "22", border: `1px solid ${slot.accentColor}44`, color: slot.accentColor, fontSize: 10, flex: 1 }}
          >
            REVEAL
          </button>
        )}
        {!isOnStage ? (
          <button
            onClick={() => onEnter(slot.id, position)}
            style={{ ...btnStyle, background: slot.accentColor, color: "#030305", fontWeight: 700, flex: 2 }}
          >
            ENTRADA
          </button>
        ) : (
          <button
            onClick={() => onExit(slot.id)}
            style={{ ...btnStyle, background: "rgba(255,68,102,0.2)", border: "1px solid rgba(255,68,102,0.5)", color: "#ff4466", flex: 2 }}
          >
            SAIDA
          </button>
        )}
        {isOnStage && (
          <button
            onClick={() => onSpotlight(slot.id)}
            style={{ ...btnStyle, background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.4)", color: "#ffd700", flex: 1, fontSize: 16 }}
          >
            ★
          </button>
        )}
        <button
          onClick={() => setEditing(true)}
          style={{ ...btnStyle, background: "transparent", border: "1px solid #333", color: "#555", fontSize: 10, padding: "8px" }}
        >
          ✎
        </button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 8,
  fontSize: 11,
  fontFamily: "Orbitron, sans-serif",
  letterSpacing: 1,
  cursor: "pointer",
  transition: "all 0.15s",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "10px 14px",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  fontFamily: "Montserrat, sans-serif",
  boxSizing: "border-box",
};
