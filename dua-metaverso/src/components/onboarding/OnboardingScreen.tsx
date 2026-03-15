"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-[#030305]/95 transition-opacity duration-[600ms] ${fadeOut ? "opacity-0" : "opacity-100"}`}>
      <div
        className="mx-4 w-full max-w-lg overflow-y-auto rounded-2xl border border-white/8 p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg, rgba(6,6,18,0.98), rgba(3,3,5,0.98))", maxHeight: "92vh" }}
      >
        <h1 className="mb-1 font-heading text-lg font-black tracking-[0.15em] text-white uppercase sm:text-xl">
          Entrar no Concerto
        </h1>
        <p className="mb-5 text-[11px] leading-relaxed text-white/30 sm:text-xs">
          Escolhe o teu nome, rosto, corpo e país para entrar no metaverso.
        </p>

        {/* Name + Combined Preview Row */}
        <div className="mb-5 flex gap-4">
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-heading tracking-[0.2em] text-white/40 uppercase">
              Nome
            </label>
            <Input
              ref={nameRef}
              className="border-white/8 bg-white/4 text-white placeholder-white/20"
              placeholder="O teu nome"
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          {/* Combined Avatar Preview */}
          <div className="flex flex-col items-center">
            <label className="mb-1.5 block text-[10px] font-heading tracking-[0.2em] text-white/40 uppercase">
              Preview
            </label>
            <div
              className="overflow-hidden rounded-lg border"
              style={{ width: 120, height: 200, borderColor: bodyAccent, background: "rgba(255,255,255,0.02)" }}
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
              <span className="mt-1 text-[10px] text-white/40">{selectedCountry.flag}</span>
            )}
          </div>
        </div>

        {/* Face Selection */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[10px] font-heading tracking-[0.2em] text-white/40 uppercase">
            Rosto
          </label>
          <div className="flex gap-2 sm:gap-3">
            {FACE_IDS.map((id) => {
              const cfg = FACE_CONFIGS[id];
              const selected = id === face;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFace(id)}
                  className="flex-1 flex flex-col items-center rounded-lg border px-1 py-2 text-center transition-all"
                  style={{
                    borderColor: selected ? bodyAccent : "rgba(255,255,255,0.08)",
                    background: selected
                      ? `linear-gradient(135deg, ${bodyAccent}15, ${bodyAccent}08)`
                      : "rgba(255,255,255,0.02)",
                    opacity: selected ? 1 : 0.55,
                  }}
                >
                  <div className="overflow-hidden rounded" style={{ width: 80, height: 80 }}>
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
                    className="mt-1 block text-[9px] font-heading font-bold tracking-wider"
                    style={{ color: selected ? bodyAccent : "rgba(255,255,255,0.4)" }}
                  >
                    {cfg.label.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Selection */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[10px] font-heading tracking-[0.2em] text-white/40 uppercase">
            Corpo
          </label>
          <div className="flex gap-2 sm:gap-3">
            {BODY_IDS.map((id) => {
              const cfg = BODY_CONFIGS[id];
              const selected = id === body;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBody(id)}
                  className="flex-1 flex flex-col items-center rounded-lg border px-1 py-2 text-center transition-all"
                  style={{
                    borderColor: selected ? cfg.accent : "rgba(255,255,255,0.08)",
                    background: selected
                      ? `linear-gradient(135deg, ${cfg.accent}15, ${cfg.accent}08)`
                      : "rgba(255,255,255,0.02)",
                    opacity: selected ? 1 : 0.55,
                  }}
                >
                  <div className="overflow-hidden rounded" style={{ width: 80, height: 120 }}>
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
                    className="mt-1 block text-[9px] font-heading font-bold tracking-wider"
                    style={{ color: selected ? cfg.accent : "rgba(255,255,255,0.4)" }}
                  >
                    {cfg.label.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Country */}
        <div className="mb-5">
          <label className="mb-1.5 block text-[10px] font-heading tracking-[0.2em] text-white/40 uppercase">
            País {selectedCountry ? selectedCountry.flag : ""}
          </label>
          <Input
            className="mb-2 border-white/8 bg-white/4 text-white placeholder-white/20"
            placeholder="Pesquisar país..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-28 overflow-y-auto rounded-lg border border-white/5 bg-white/2 sm:max-h-32">
            {filteredCountries.lusophone.length > 0 && (
              <>
                {filteredCountries.lusophone.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => { setCountry(c.code); setSearch(""); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
                    style={{ color: c.code === country ? bodyAccent : "rgba(255,255,255,0.6)" }}
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
                {filteredCountries.other.length > 0 && (
                  <div className="mx-3 my-1 h-px bg-white/8" />
                )}
              </>
            )}
            {filteredCountries.other.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { setCountry(c.code); setSearch(""); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
                style={{ color: c.code === country ? bodyAccent : "rgba(255,255,255,0.6)" }}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          className="w-full font-heading text-sm font-bold tracking-wider disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #00ccaa, #00ffcc, #a855f6, #ff00ff)",
            minHeight: "var(--touch-min)",
          }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "A ENTRAR..." : "ENTRAR"}
        </Button>
      </div>
    </div>
  );
}
