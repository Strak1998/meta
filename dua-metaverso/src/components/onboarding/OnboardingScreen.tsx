"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { LUSOPHONE_COUNTRIES, OTHER_COUNTRIES } from "@/lib/countries";
import { FACE_CONFIGS, FACE_IDS } from "@/lib/avatar-faces";
import { BODY_CONFIGS, BODY_IDS, BODY_TO_STYLE } from "@/lib/avatar-bodies";
import { AvatarFaceComponent } from "@/components/three/AvatarFaces";
import { AvatarBodyComponent } from "@/components/three/AvatarBodies";
import { CompositeAvatar } from "@/components/three/CompositeAvatar";
import type { AvatarFace, AvatarBody, AvatarSelection } from "@/types/user";
import type { UserProfile } from "@/types/user";

/* Small auto-rotate wrapper for preview cards */
function AutoRotate({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.6;
  });
  return <group ref={ref}>{children}</group>;
}

/* Minimal lighting for preview canvases */
function PreviewLights() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={1} />
    </>
  );
}

interface OnboardingScreenProps {
  onJoin: (user: UserProfile) => void;
}

export default function OnboardingScreen({ onJoin }: OnboardingScreenProps) {
  const [name, setName] = useState("");
  const [face, setFace] = useState<AvatarFace>("A");
  const [body, setBody] = useState<AvatarBody>("1");
  const [country, setCountry] = useState("PT");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const pendingUser = useRef<UserProfile | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const avatar = useMemo<AvatarSelection>(() => ({ face, body }), [face, body]);

  const filteredCountries = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return { lusophone: LUSOPHONE_COUNTRIES, other: OTHER_COUNTRIES };
    return {
      lusophone: LUSOPHONE_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)),
      other: OTHER_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)),
    };
  }, [search]);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const finalName = name.trim() || `LUA${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          avatarFace: avatar.face,
          avatarBody: avatar.body,
          avatarStyle: BODY_TO_STYLE[avatar.body],
          country,
        }),
      });

      if (!res.ok) {
        setSubmitting(false);
        return;
      }

      const user: UserProfile = await res.json();
      pendingUser.current = user;
      setFadeOut(true);
      setTimeout(() => {
        if (pendingUser.current) onJoin(pendingUser.current);
      }, 600);
    } catch {
      setSubmitting(false);
    }
  };

  const selectedCountry = [...LUSOPHONE_COUNTRIES, ...OTHER_COUNTRIES].find((c) => c.code === country);
  const bodyAccent = BODY_CONFIGS[body].accent;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-[600ms] ${fadeOut ? "opacity-0" : "opacity-100"}`} style={{ background: "var(--bg-overlay)" }}>
      <div
        className="mx-4 w-full max-w-[480px] overflow-y-auto p-8"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
          border: "var(--glass-border)",
          boxShadow: "var(--glass-shadow)",
          borderRadius: "var(--radius-sm)",
          maxHeight: "92vh",
          padding: "32px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-orbitron), sans-serif",
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: 32,
            letterSpacing: "0.08em",
            lineHeight: 1.1,
          }}
        >
          DUA
        </h1>

        {/* Name + Combined Preview Row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-orbitron), sans-serif",
                fontWeight: 400,
                fontSize: "0.625rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Nome
            </label>
            <input
              ref={nameRef}
              type="text"
              placeholder="O teu nome"
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: "0.5px solid var(--border-default)",
                padding: "8px 0",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontWeight: 500,
                fontSize: 14,
                color: "var(--text-primary)",
                outline: "none",
                transition: "border-color var(--duration-base)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = "var(--accent-primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = "var(--border-default)"; }}
            />
          </div>
          {/* Combined Avatar Preview */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-orbitron), sans-serif",
                fontWeight: 400,
                fontSize: "0.625rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Preview
            </label>
            <div
              style={{
                width: 120,
                height: 200,
                overflow: "hidden",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${bodyAccent}`,
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <Canvas
                camera={{ position: [0, 0.3, 1.8], fov: 40 }}
                gl={{ antialias: true, alpha: true }}
                style={{ width: 120, height: 200 }}
              >
                <PreviewLights />
                <Suspense fallback={null}>
                  <CompositeAvatar face={avatar.face} body={avatar.body} idle scale={1.8} />
                </Suspense>
              </Canvas>
            </div>
            {selectedCountry && (
              <span style={{ marginTop: 4, fontSize: 10, color: "var(--text-muted)" }}>{selectedCountry.flag}</span>
            )}
          </div>
        </div>

        {/* Face Selection */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-orbitron), sans-serif",
              fontWeight: 400,
              fontSize: "0.625rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 6,
            }}
          >
            Rosto
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {FACE_IDS.map((id) => {
              const cfg = FACE_CONFIGS[id];
              const selected = id === face;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFace(id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "8px 4px",
                    border: `1px solid ${selected ? "var(--border-active)" : "var(--border-subtle)"}`,
                    borderRadius: "var(--radius-md)",
                    background: selected ? "rgba(0,255,204,0.05)" : "transparent",
                    opacity: selected ? 1 : 0.45,
                    cursor: "pointer",
                    transition: "border-color var(--duration-base), opacity var(--duration-base), background var(--duration-base)",
                  }}
                >
                  <div style={{ width: 80, height: 80, overflow: "hidden", borderRadius: "var(--radius-sm)" }}>
                    <Canvas
                      camera={{ position: [0, 0, 0.55], fov: 40 }}
                      gl={{ antialias: true, alpha: true }}
                      style={{ width: 80, height: 80 }}
                    >
                      <PreviewLights />
                      <Suspense fallback={null}>
                        <AutoRotate>
                          <AvatarFaceComponent face={id} />
                        </AutoRotate>
                      </Suspense>
                    </Canvas>
                  </div>
                  <span
                    style={{
                      marginTop: 4,
                      fontFamily: "var(--font-orbitron), sans-serif",
                      fontWeight: 400,
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: selected ? bodyAccent : "var(--text-muted)",
                    }}
                  >
                    {cfg.label.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Selection */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-orbitron), sans-serif",
              fontWeight: 400,
              fontSize: "0.625rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 6,
            }}
          >
            Corpo
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {BODY_IDS.map((id) => {
              const cfg = BODY_CONFIGS[id];
              const selected = id === body;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBody(id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "8px 4px",
                    border: `1px solid ${selected ? "var(--border-active)" : "var(--border-subtle)"}`,
                    borderRadius: "var(--radius-md)",
                    background: selected ? `rgba(0,255,204,0.05)` : "transparent",
                    opacity: selected ? 1 : 0.45,
                    cursor: "pointer",
                    transition: "border-color var(--duration-base), opacity var(--duration-base), background var(--duration-base)",
                  }}
                >
                  <div style={{ width: 80, height: 120, overflow: "hidden", borderRadius: "var(--radius-sm)" }}>
                    <Canvas
                      camera={{ position: [0, 0, 1.6], fov: 40 }}
                      gl={{ antialias: true, alpha: true }}
                      style={{ width: 80, height: 120 }}
                    >
                      <PreviewLights />
                      <Suspense fallback={null}>
                        <AvatarBodyComponent body={id} />
                      </Suspense>
                    </Canvas>
                  </div>
                  <span
                    style={{
                      marginTop: 4,
                      fontFamily: "var(--font-orbitron), sans-serif",
                      fontWeight: 400,
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: selected ? cfg.accent : "var(--text-muted)",
                    }}
                  >
                    {cfg.label.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Country */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-orbitron), sans-serif",
              fontWeight: 400,
              fontSize: "0.625rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 6,
            }}
          >
            País {selectedCountry ? selectedCountry.flag : ""}
          </label>
          <input
            type="text"
            placeholder="Pesquisar país..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "0.5px solid var(--border-default)",
              padding: "8px 0",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontWeight: 400,
              fontSize: 13,
              color: "var(--text-primary)",
              outline: "none",
              marginBottom: 8,
            }}
          />
          <div
            style={{
              maxHeight: 112,
              overflowY: "auto",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {filteredCountries.lusophone.length > 0 && (
              <>
                {filteredCountries.lusophone.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => { setCountry(c.code); setSearch(""); }}
                    style={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 12px",
                      textAlign: "left",
                      fontFamily: "var(--font-montserrat), sans-serif",
                      fontSize: 12,
                      color: c.code === country ? bodyAccent : "var(--text-secondary)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "background var(--duration-fast)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
                {filteredCountries.other.length > 0 && (
                  <div style={{ margin: "4px 12px", height: 1, background: "var(--border-subtle)" }} />
                )}
              </>
            )}
            {filteredCountries.other.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { setCountry(c.code); setSearch(""); }}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  textAlign: "left",
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: 12,
                  color: c.code === country ? bodyAccent : "var(--text-secondary)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%",
            height: 44,
            borderRadius: "var(--radius-sm)",
            background: "linear-gradient(135deg, #00ffcc, #00ddaa)",
            border: "none",
            fontFamily: "var(--font-orbitron), sans-serif",
            fontWeight: 900,
            fontSize: 11,
            letterSpacing: "0.4em",
            color: "#030305",
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.4 : 1,
            transition: "filter var(--duration-fast), transform var(--duration-fast)",
            textTransform: "uppercase",
          }}
          onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.filter = "brightness(1.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = ""; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.99)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = ""; }}
        >
          {submitting ? "A ENTRAR..." : "ENTRAR"}
        </button>
      </div>
    </div>
  );
}
