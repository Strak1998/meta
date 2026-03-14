"use client";

import { useState, useEffect } from "react";
import type { ArtistSlot, StagePosition } from "@/types/artist";
import { defaultArtistSlots } from "@/lib/artist-registry";

const POSITION_OPTIONS: { value: StagePosition; label: string }[] = [
  { value: "esquerda", label: "ESQUERDA" },
  { value: "centro", label: "CENTRO" },
  { value: "direita", label: "DIREITA" },
];

export default function ArtistsManagementPage() {
  const [slots, setSlots] = useState<ArtistSlot[]>(defaultArtistSlots);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<ArtistSlot>>({});
  const [saved, setSaved] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/command")
      .then((r) => r.json())
      .then((data) => {
        if (data?.state?.artists?.length) {
          setSlots(data.state.artists);
        }
      })
      .catch(() => {});
  }, []);

  const startEdit = (slot: ArtistSlot) => {
    setEditingId(slot.id);
    setDraft({ ...slot });
    setPreviewId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const saveSlot = async () => {
    if (!editingId || !draft) return;
    const updated = slots.map((s) => (s.id === editingId ? { ...s, ...draft } as ArtistSlot : s));
    setSlots(updated);
    setEditingId(null);
    setDraft({});

    await fetch("/api/admin/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PHASE_CHANGE",
        payload: { _artistUpdate: { artistId: editingId, updates: draft } },
      }),
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...slots];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setSlots(next);
  };

  const moveDown = (index: number) => {
    if (index === slots.length - 1) return;
    const next = [...slots];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setSlots(next);
  };

  const testArtist = async (slot: ArtistSlot) => {
    setPreviewId(slot.id);
    await fetch("/api/admin/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "OVERLAY_SHOW",
        payload: { overlayType: "artist_name", artistId: slot.id, duration: 3000 },
      }),
    });
    setTimeout(() => setPreviewId(null), 3000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030305",
        color: "#e8e8e8",
        fontFamily: "Orbitron, sans-serif",
        padding: 32,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 4, marginBottom: 6 }}>DUA BACKSTAGE</div>
            <div style={{ fontSize: 22, color: "#00ffcc", fontWeight: 700, letterSpacing: 2 }}>GESTAO DE ARTISTAS</div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {saved && (
              <div style={{ fontSize: 11, color: "#00ff88", letterSpacing: 2 }}>GUARDADO</div>
            )}
            <a
              href="/backstage"
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "1px solid rgba(0,255,204,0.3)",
                borderRadius: 8,
                color: "#00ffcc",
                fontSize: 11,
                letterSpacing: 2,
                textDecoration: "none",
              }}
            >
              ← BACKSTAGE
            </a>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {slots.map((slot, index) => (
            <div
              key={slot.id}
              style={{
                background: "rgba(0,0,0,0.5)",
                border: `1px solid ${slot.name ? slot.accentColor + "33" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* Slot header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  background: editingId === slot.id ? `${slot.accentColor}0a` : "transparent",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    style={{ ...miniBtn, opacity: index === 0 ? 0.2 : 1 }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === slots.length - 1}
                    style={{ ...miniBtn, opacity: index === slots.length - 1 ? 0.2 : 1 }}
                  >
                    ▼
                  </button>
                </div>

                <div
                  style={{
                    width: 4,
                    height: 40,
                    background: slot.name ? slot.accentColor : "#333",
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />

                <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, width: 28, flexShrink: 0 }}>
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: slot.name ? slot.accentColor + "33" : "rgba(255,255,255,0.05)",
                    border: `2px solid ${slot.name ? slot.accentColor + "66" : "#333"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                    color: slot.name ? slot.accentColor : "#444",
                  }}
                >
                  {slot.name ? slot.name.charAt(0) : "?"}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: slot.name ? "#fff" : "#444", fontWeight: 600, letterSpacing: 1 }}>
                    {slot.name || "SLOT VAZIO"}
                  </div>
                  {slot.bio && <div style={{ fontSize: 11, color: "#666", marginTop: 2, fontFamily: "Montserrat, sans-serif" }}>{slot.bio}</div>}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {slot.name && previewId !== slot.id && (
                    <button
                      onClick={() => testArtist(slot)}
                      style={{
                        ...miniBtn,
                        border: `1px solid ${slot.accentColor}44`,
                        color: slot.accentColor,
                        padding: "6px 12px",
                        fontSize: 10,
                        letterSpacing: 1,
                      }}
                    >
                      TEST
                    </button>
                  )}
                  {previewId === slot.id && (
                    <div style={{ fontSize: 10, color: slot.accentColor, letterSpacing: 2 }}>PREVIEW...</div>
                  )}
                  <button
                    onClick={() => (editingId === slot.id ? cancelEdit() : startEdit(slot))}
                    style={{
                      ...miniBtn,
                      background: editingId === slot.id ? "rgba(255,68,102,0.1)" : "transparent",
                      border: `1px solid ${editingId === slot.id ? "rgba(255,68,102,0.3)" : "#333"}`,
                      color: editingId === slot.id ? "#ff4466" : "#666",
                      padding: "6px 14px",
                    }}
                  >
                    {editingId === slot.id ? "CANCELAR" : "EDITAR"}
                  </button>
                </div>
              </div>

              {/* Edit form */}
              {editingId === slot.id && (
                <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 0 4px" }} />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>NOME DO ARTISTA</label>
                      <input
                        autoFocus
                        value={draft.name ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        placeholder="Nome de stage"
                        style={fieldStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>BIO / GENERO</label>
                      <input
                        value={draft.bio ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                        placeholder="ex: Afro-House & Kizomba"
                        style={fieldStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>COR DE ACENTO</label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="color"
                          value={draft.accentColor ?? "#00ffcc"}
                          onChange={(e) => setDraft((d) => ({ ...d, accentColor: e.target.value }))}
                          style={{ width: 40, height: 36, border: "none", background: "none", cursor: "pointer" }}
                        />
                        <input
                          value={draft.accentColor ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...d, accentColor: e.target.value }))}
                          style={{ ...fieldStyle, flex: 1, fontFamily: "monospace" }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>COR DE PELE (avatar)</label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="color"
                          value={draft.skinColor ?? "#8B4513"}
                          onChange={(e) => setDraft((d) => ({ ...d, skinColor: e.target.value }))}
                          style={{ width: 40, height: 36, border: "none", background: "none", cursor: "pointer" }}
                        />
                        <input
                          value={draft.skinColor ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...d, skinColor: e.target.value }))}
                          style={{ ...fieldStyle, flex: 1, fontFamily: "monospace" }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>COR DE ROUPA (avatar)</label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="color"
                          value={draft.clothingColor ?? "#ff6b35"}
                          onChange={(e) => setDraft((d) => ({ ...d, clothingColor: e.target.value }))}
                          style={{ width: 40, height: 36, border: "none", background: "none", cursor: "pointer" }}
                        />
                        <input
                          value={draft.clothingColor ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...d, clothingColor: e.target.value }))}
                          style={{ ...fieldStyle, flex: 1, fontFamily: "monospace" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>POSICAO PADRAO</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {POSITION_OPTIONS.map(({ value, label }) => (
                          <button
                            key={value}
                            onClick={() => setDraft((d) => ({ ...d, defaultPosition: value }))}
                            style={{
                              ...miniBtn,
                              flex: 1,
                              padding: "8px 0",
                              background: draft.defaultPosition === value ? (draft.accentColor ?? "#00ffcc") + "22" : "transparent",
                              border: `1px solid ${draft.defaultPosition === value ? (draft.accentColor ?? "#00ffcc") : "#333"}`,
                              color: draft.defaultPosition === value ? (draft.accentColor ?? "#00ffcc") : "#555",
                              fontSize: 9,
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>DURACAO DE ENTRADA (ms)</label>
                      <input
                        type="number"
                        min={500}
                        max={8000}
                        step={500}
                        value={draft.entryAnimationDuration ?? 2000}
                        onChange={(e) => setDraft((d) => ({ ...d, entryAnimationDuration: Number(e.target.value) }))}
                        style={fieldStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>URL DA MUSICA DE ENTRADA (opcional)</label>
                    <input
                      type="url"
                      value={draft.entryMusicUrl ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, entryMusicUrl: e.target.value || undefined }))}
                      placeholder="https://..."
                      style={fieldStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>URL DO AVATAR GLB (opcional)</label>
                    <input
                      type="url"
                      value={draft.avatarGlbUrl ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, avatarGlbUrl: e.target.value || undefined }))}
                      placeholder="https://.../avatar.glb"
                      style={fieldStyle}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      onClick={saveSlot}
                      style={{
                        flex: 1,
                        padding: "14px",
                        background: draft.accentColor ?? "#00ffcc",
                        color: "#030305",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "Orbitron, sans-serif",
                        letterSpacing: 2,
                        cursor: "pointer",
                      }}
                    >
                      GUARDAR ARTISTA
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{
                        padding: "14px 24px",
                        background: "transparent",
                        border: "1px solid #333",
                        borderRadius: 8,
                        color: "#666",
                        fontSize: 12,
                        fontFamily: "Orbitron, sans-serif",
                        cursor: "pointer",
                      }}
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #333",
  borderRadius: 6,
  color: "#555",
  fontSize: 12,
  cursor: "pointer",
  padding: "4px 8px",
  fontFamily: "Orbitron, sans-serif",
  transition: "all 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 9,
  color: "#555",
  letterSpacing: 2,
  marginBottom: 6,
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "10px 14px",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  fontFamily: "Montserrat, sans-serif",
  boxSizing: "border-box" as const,
};
