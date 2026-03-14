"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArtistCard } from "@/components/backstage/ArtistCard";
import type { ArtistSlot, StagePosition, ConcertState, OverlayType } from "@/types/artist";
import { defaultArtistSlots } from "@/lib/artist-registry";

const PHASES = [
  { id: "opening", label: "ABERTURA", color: "#00ffcc" },
  { id: "dua2_presentation", label: "DUA 2.0", color: "#ff00ff" },
  { id: "vado_performance", label: "VADO MKA", color: "#ff6b35" },
  { id: "uzzy_performance", label: "UZZY", color: "#9b59b6" },
  { id: "estraca_performance", label: "ESTRACA", color: "#00d4ff" },
  { id: "finale", label: "FINALE", color: "#ffd700" },
] as const;

type TabKey = "maestro" | "artistas" | "audio" | "chat" | "dua" | "emergencia";

const TABS: { key: TabKey; label: string }[] = [
  { key: "maestro", label: "MAESTRO" },
  { key: "artistas", label: "ARTISTAS" },
  { key: "audio", label: "AUDIO" },
  { key: "chat", label: "CHAT" },
  { key: "dua", label: "DUA 2.0" },
  { key: "emergencia", label: "EMERGENCIA" },
];

interface AnalyticsData {
  activeViewers: number;
  viewerPeak: number;
  messagesTotal: number;
  reactionsTotal: number;
  ctaClicks: number;
  estimatedConversionRate: string;
  currentPhase: string;
  phaseElapsedMs: number;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: number;
  avatar?: string;
  flag?: string;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

async function sendCommand(type: string, payload: Record<string, unknown> = {}): Promise<void> {
  await fetch("/api/admin/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
}

export default function BackstageDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("maestro");
  const [state, setState] = useState<ConcertState>({
    phase: "opening",
    artists: defaultArtistSlots(),
    audioMode: "silence",
    isPaused: false,
    phaseStartedAt: Date.now(),
    commandLog: [],
  });
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    activeViewers: 0,
    viewerPeak: 0,
    messagesTotal: 0,
    reactionsTotal: 0,
    ctaClicks: 0,
    estimatedConversionRate: "0.0",
    currentPhase: "opening",
    phaseElapsedMs: 0,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [silenceAlert, setSilenceAlert] = useState(false);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [confirmPhase, setConfirmPhase] = useState<string | null>(null);
  const [overlayMsg, setOverlayMsg] = useState("");
  const [overlayDuration, setOverlayDuration] = useState(5);
  const [countdownValue, setCountdownValue] = useState(5);
  const [connected, setConnected] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e: MessageEvent) => {
      try {
        const cmd = JSON.parse(e.data as string);
        if (cmd.type === "PHASE_CHANGE" && cmd.payload?.init) {
          setState(cmd.payload.state as ConcertState);
        } else if (cmd.type === "PHASE_CHANGE") {
          setState((prev) => ({ ...prev, phase: cmd.payload.phase, phaseStartedAt: Date.now() }));
        } else if (cmd.type === "ARTIST_ENTER") {
          setState((prev) => ({
            ...prev,
            artists: prev.artists.map((a) =>
              a.id === cmd.payload.artistId ? { ...a, status: "em_palco" as const } : a
            ),
          }));
        } else if (cmd.type === "ARTIST_EXIT") {
          setState((prev) => ({
            ...prev,
            artists: prev.artists.map((a) =>
              a.id === cmd.payload.artistId ? { ...a, status: "saiu" as const } : a
            ),
          }));
        } else if (cmd.type === "EMERGENCY_PAUSE") {
          setState((prev) => ({ ...prev, isPaused: true }));
        } else if (cmd.type === "EMERGENCY_RESUME") {
          setState((prev) => ({ ...prev, isPaused: false }));
        }
      } catch {}
    };

    return () => es.close();
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/chat");
    es.onmessage = (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data as string);
        if (parsed.type === "init") {
          setMessages(parsed.messages ?? []);
        } else if (parsed.type === "message") {
          setMessages((prev) => [...prev.slice(-199), parsed.message]);
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) setAnalytics(await res.json());
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      setPhaseElapsed(Date.now() - (state.phaseStartedAt ?? Date.now()));
    }, 1000);
    return () => clearInterval(tick);
  }, [state.phaseStartedAt]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") {
        if ((e.target as HTMLElement).tagName === "INPUT") return;
        handleMuteToggle();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isMuted]);

  const handlePhaseChange = useCallback(
    async (phase: string) => {
      if (confirmPhase === phase) {
        await sendCommand("PHASE_CHANGE", { phase });
        setConfirmPhase(null);
      } else {
        setConfirmPhase(phase);
        setTimeout(() => setConfirmPhase(null), 3000);
      }
    },
    [confirmPhase]
  );

  const handleArtistEnter = useCallback(async (artistId: string, position: StagePosition) => {
    await sendCommand("OVERLAY_SHOW", {
      overlayType: "artist_name",
      artistId,
      duration: 3000,
    });
    setTimeout(async () => {
      await sendCommand("ARTIST_ENTER", { artistId, position });
    }, 2800);
  }, []);

  const handleArtistExit = useCallback(async (artistId: string) => {
    await sendCommand("ARTIST_EXIT", { artistId });
  }, []);

  const handleSpotlight = useCallback(async (artistId: string) => {
    await sendCommand("SPOTLIGHT", { artistId });
  }, []);

  const handleRevealName = useCallback(async (artistId: string) => {
    await sendCommand("OVERLAY_SHOW", { overlayType: "artist_name", artistId, duration: 3000 });
  }, []);

  const handleArtistUpdate = useCallback(async (artistId: string, updates: Partial<ArtistSlot>) => {
    setState((prev) => ({
      ...prev,
      artists: prev.artists.map((a) => (a.id === artistId ? { ...a, ...updates } : a)),
    }));
    await fetch("/api/admin/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "PHASE_CHANGE", payload: { _artistUpdate: { artistId, updates } } }),
    });
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted((m) => {
      if (audioRef.current) audioRef.current.volume = m ? 1 : 0;
      return !m;
    });
  }, []);

  const startStream = useCallback(
    async (url: string) => {
      if (analyserRef.current) return;
      try {
        const ctx = new AudioContext();
        const audio = new Audio(url);
        audio.crossOrigin = "anonymous";
        audioRef.current = audio;
        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;
        audio.volume = isMuted ? 0 : 1;
        await audio.play();

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setAudioLevel(Math.min(100, Math.round((avg / 255) * 200)));
          animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);

        await sendCommand("AUDIO_SOURCE", { mode: "stream", url });
      } catch (err) {
        console.error(err);
      }
    },
    [isMuted]
  );

  const stopStream = useCallback(async () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
    await sendCommand("AUDIO_SOURCE", { mode: "silence" });
  }, []);

  const sendChatMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: "DUA Bot", text: text.trim(), flag: "PT" }),
      });
      setChatInput("");
    },
    []
  );

  const highlightMessage = useCallback(async (msgId: string) => {
    await sendCommand("CHAT_HIGHLIGHT", { messageId: msgId });
  }, []);

  const showOverlay = useCallback(
    async (type: OverlayType) => {
      await sendCommand("OVERLAY_SHOW", {
        overlayType: type,
        message: overlayMsg,
        duration: overlayDuration * 1000,
        countdown: countdownValue,
      });
    },
    [overlayMsg, overlayDuration, countdownValue]
  );

  const currentPhaseConfig = PHASES.find((p) => p.id === state.phase);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030305",
        color: "#e8e8e8",
        fontFamily: "Orbitron, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "rgba(0,0,0,0.9)",
          borderBottom: "1px solid rgba(0,255,204,0.2)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 11, color: "#00ffcc", letterSpacing: 4 }}>DUA</div>
          <div style={{ width: 1, height: 20, background: "#333" }} />
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#888" }}>BACKSTAGE</div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: 2,
              padding: "3px 8px",
              borderRadius: 4,
              background: connected ? "rgba(0,255,100,0.15)" : "rgba(255,68,102,0.15)",
              color: connected ? "#00ff88" : "#ff4466",
              border: `1px solid ${connected ? "rgba(0,255,100,0.3)" : "rgba(255,68,102,0.3)"}`,
            }}
          >
            {connected ? "ONLINE" : "OFFLINE"}
          </div>
          {state.isPaused && (
            <div
              style={{
                fontSize: 9,
                letterSpacing: 2,
                padding: "3px 8px",
                borderRadius: 4,
                background: "rgba(255,140,0,0.2)",
                color: "#ffa500",
                border: "1px solid rgba(255,140,0,0.4)",
              }}
            >
              PAUSADO
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 2 }}>FASE ACTUAL</div>
            <div style={{ fontSize: 13, color: currentPhaseConfig?.color ?? "#00ffcc", fontWeight: 700 }}>
              {currentPhaseConfig?.label ?? state.phase.toUpperCase()}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 2 }}>DURACAO</div>
            <div style={{ fontSize: 13, color: "#888", fontFamily: "monospace" }}>
              {formatElapsed(phaseElapsed)}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 2 }}>ESPECTADORES</div>
            <div style={{ fontSize: 13, color: "#00ffcc", fontWeight: 700 }}>
              {analytics.activeViewers}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href="/"
              target="_blank"
              style={{ ...btnStyle, fontSize: 10, background: "rgba(0,255,204,0.1)", border: "1px solid rgba(0,255,204,0.3)", color: "#00ffcc", textDecoration: "none", padding: "8px 14px" }}
            >
              VER CONCERTO
            </a>
            <a
              href="/backstage/artists"
              style={{ ...btnStyle, fontSize: 10, background: "transparent", border: "1px solid #333", color: "#666", textDecoration: "none", padding: "8px 14px" }}
            >
              ARTISTAS
            </a>
            <button
              onClick={async () => {
                await fetch("/api/admin/auth", { method: "DELETE" });
                router.push("/backstage/login");
              }}
              style={{ ...btnStyle, fontSize: 10, background: "transparent", border: "1px solid #333", color: "#555" }}
            >
              SAIR
            </button>
          </div>
        </div>
      </div>

      {/* Metrics bar */}
      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "8px 24px",
          display: "flex",
          gap: 32,
        }}
      >
        {[
          { label: "PICO", value: analytics.viewerPeak },
          { label: "MSGS", value: analytics.messagesTotal },
          { label: "REACOES", value: analytics.reactionsTotal },
          { label: "CTA CLICKS", value: analytics.ctaClicks },
          { label: "CONVERSAO", value: `${analytics.estimatedConversionRate}%` },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "#555", letterSpacing: 2 }}>{label}</span>
            <span style={{ fontSize: 13, color: "#888", fontFamily: "monospace" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.4)",
          padding: "0 24px",
        }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "14px 20px",
              background: "transparent",
              border: "none",
              borderBottom: tab === key ? "2px solid #00ffcc" : "2px solid transparent",
              color: tab === key ? "#00ffcc" : "#555",
              fontSize: 10,
              letterSpacing: 2,
              cursor: "pointer",
              fontFamily: "Orbitron, sans-serif",
              transition: "all 0.2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, padding: 24, overflow: "auto" }}>
        {/* MAESTRO */}
        {tab === "maestro" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={sectionTitle}>CONTROLO DE FASES</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {PHASES.map((phase) => {
                  const isActive = state.phase === phase.id;
                  const isConfirm = confirmPhase === phase.id;
                  return (
                    <button
                      key={phase.id}
                      onClick={() => handlePhaseChange(phase.id)}
                      style={{
                        padding: "20px 16px",
                        background: isActive ? `${phase.color}22` : isConfirm ? `${phase.color}15` : "rgba(0,0,0,0.4)",
                        border: `2px solid ${isActive ? phase.color : isConfirm ? phase.color + "88" : "#222"}`,
                        borderRadius: 12,
                        color: isActive ? phase.color : isConfirm ? phase.color + "cc" : "#555",
                        fontSize: isConfirm ? 10 : 14,
                        fontWeight: 700,
                        fontFamily: "Orbitron, sans-serif",
                        letterSpacing: 2,
                        cursor: isActive ? "default" : "pointer",
                        transition: "all 0.2s",
                        boxShadow: isActive ? `0 0 20px ${phase.color}22` : undefined,
                      }}
                    >
                      {isConfirm ? `CONFIRMAR? ${phase.label}` : isActive ? `► ${phase.label}` : phase.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <button
                onClick={() => sendCommand("CONFETTI", { intensity: "high", colors: ["#00ffcc", "#ff00ff", "#ffd700"] })}
                style={actionBtn}
              >
                CONFETTI
              </button>
              <button
                onClick={() => sendCommand("CTA_TRIGGER", { variant: "default" })}
                style={actionBtn}
              >
                LANCAR CTA
              </button>
              <button
                onClick={() => sendCommand("OVERLAY_SHOW", { overlayType: "applause", duration: 3000 })}
                style={actionBtn}
              >
                APLAUSOS
              </button>
            </div>
          </div>
        )}

        {/* ARTISTAS */}
        {tab === "artistas" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={sectionTitle}>SLOTS DE ARTISTAS</div>
              <a
                href="/backstage/artists"
                style={{ fontSize: 10, color: "#00ffcc", letterSpacing: 2, textDecoration: "none" }}
              >
                GESTAO COMPLETA →
              </a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {state.artists.map((slot) => (
                <ArtistCard
                  key={slot.id}
                  slot={slot}
                  onEnter={handleArtistEnter}
                  onExit={handleArtistExit}
                  onSpotlight={handleSpotlight}
                  onUpdate={handleArtistUpdate}
                  onRevealName={handleRevealName}
                />
              ))}
            </div>
          </div>
        )}

        {/* AUDIO */}
        {tab === "audio" && (
          <div style={{ maxWidth: 640 }}>
            <div style={sectionTitle}>CONTROLO DE AUDIO</div>

            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              {(["silence", "stream", "microphone"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={async () => {
                    if (mode === "stream" && streamUrl) {
                      await startStream(streamUrl);
                    } else if (mode === "silence") {
                      await stopStream();
                    } else {
                      await sendCommand("AUDIO_SOURCE", { mode });
                    }
                  }}
                  style={{
                    ...btnStyle,
                    flex: 1,
                    padding: "14px",
                    background: state.audioMode === mode ? "rgba(0,255,204,0.15)" : "rgba(0,0,0,0.4)",
                    border: `1px solid ${state.audioMode === mode ? "#00ffcc" : "#333"}`,
                    color: state.audioMode === mode ? "#00ffcc" : "#666",
                    fontSize: 11,
                  }}
                >
                  {mode === "silence" ? "SILENCIO" : mode === "stream" ? "STREAM URL" : "MICROFONE"}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>URL DO STREAM (Icecast / HLS / MP3)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="url"
                  placeholder="http://localhost:8000/stream.mp3"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={() => startStream(streamUrl)}
                  disabled={!streamUrl}
                  style={{ ...btnStyle, background: "#00ffcc", color: "#030305", padding: "0 20px", fontWeight: 700 }}
                >
                  LIGAR
                </button>
                <button
                  onClick={stopStream}
                  style={{ ...btnStyle, background: "transparent", border: "1px solid #333", color: "#666", padding: "0 14px" }}
                >
                  STOP
                </button>
              </div>
            </div>

            {/* VU Meter */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={labelStyle}>NIVEL DE AUDIO</div>
                {silenceAlert && (
                  <div style={{ fontSize: 10, color: "#ff4466", letterSpacing: 2, animation: "pulse 1s infinite" }}>
                    SILENCIO DETECTADO
                  </div>
                )}
              </div>
              <div
                style={{
                  height: 24,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 4,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${audioLevel}%`,
                    background: audioLevel > 80 ? "#ff4466" : audioLevel > 60 ? "#ffd700" : "#00ffcc",
                    borderRadius: 4,
                    transition: "width 0.05s, background 0.2s",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 10,
                    color: "#888",
                    fontFamily: "monospace",
                  }}
                >
                  {audioLevel}%
                </div>
              </div>
            </div>

            <button
              onClick={handleMuteToggle}
              style={{
                ...btnStyle,
                background: isMuted ? "rgba(255,68,102,0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${isMuted ? "rgba(255,68,102,0.5)" : "#333"}`,
                color: isMuted ? "#ff4466" : "#888",
                width: "100%",
                padding: "14px",
                fontSize: 12,
              }}
            >
              {isMuted ? "MUTE ACTIVO — CLICK OU M PARA DESMUTAR" : "MUTE (tecla M)"}
            </button>

            <div
              style={{
                marginTop: 24,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ ...sectionTitle, marginBottom: 12 }}>INSTRUCOES DE LIGACAO</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { title: "ABLETON → ICECAST LOCAL", desc: "Instala Icecast2. Usa o Max for Live ou plugin Liquidsoap. Stream URL: http://localhost:8000/live.mp3" },
                  { title: "MESA FISICA → USB INTERFACE", desc: "Liga a mesa via interface USB (ex: Focusrite Scarlett). Selecciona modo MICROFONE. O browser captura o input USB directamente." },
                  { title: "MIXLR / SOUNDCLOUD LIVE", desc: "Inicia stream no Mixlr. Copia o stream URL publico e cola em Stream URL acima." },
                  { title: "VIRTUALDJ / MIXXX → ICECAST", desc: "Configura broadcast em VirtualDJ: Settings > Broadcast > Icecast2. Port 8000, mount /stream. Password: hackme." },
                ].map(({ title, desc }) => (
                  <div key={title} style={{ borderLeft: "2px solid rgba(0,255,204,0.2)", paddingLeft: 12 }}>
                    <div style={{ fontSize: 10, color: "#00ffcc", letterSpacing: 1, marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6, fontFamily: "Montserrat, sans-serif" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHAT */}
        {tab === "chat" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, height: "calc(100vh - 200px)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={sectionTitle}>FEED DE MENSAGENS</div>
              <div
                style={{
                  flex: 1,
                  background: "rgba(0,0,0,0.4)",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.06)",
                  overflow: "auto",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.02)",
                      alignItems: "flex-start",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(0,255,204,0.04)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")}
                  >
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 11, color: "#00ffcc", fontWeight: 600 }}>{msg.user}</span>
                      {msg.flag && <span style={{ marginLeft: 4, fontSize: 10 }}>{msg.flag}</span>}
                      <span style={{ fontSize: 11, color: "#888", marginLeft: 8, fontFamily: "monospace" }}>
                        {new Date(msg.timestamp).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div style={{ fontSize: 13, color: "#ccc", marginTop: 2, fontFamily: "Montserrat, sans-serif" }}>
                        {msg.text}
                      </div>
                    </div>
                    <button
                      onClick={() => highlightMessage(msg.id)}
                      title="Destacar no ecra"
                      style={{ ...btnStyle, background: "transparent", border: "1px solid #333", color: "#555", padding: "4px 8px", fontSize: 12 }}
                    >
                      ★
                    </button>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  placeholder="Mensagem como DUA Bot..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage(chatInput)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={() => sendChatMessage(chatInput)}
                  disabled={!chatInput.trim()}
                  style={{ ...btnStyle, background: "#00ffcc", color: "#030305", padding: "0 20px", fontWeight: 700 }}
                >
                  ENVIAR
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={sectionTitle}>ACOES RAPIDAS</div>
              {[
                { label: "INTERVALO 5 MIN", cmd: () => sendCommand("CHAT_BROADCAST", { text: "Intervalo de 5 minutos. Ja voltamos!" }) },
                { label: "OBRIGADO!", cmd: () => sendCommand("CHAT_BROADCAST", { text: "Obrigado por estarem aqui hoje! Este momento e especial." }) },
                { label: "A SEGUIR: VADO", cmd: () => sendCommand("CHAT_BROADCAST", { text: "A seguir: VADO MKA no palco!" }) },
              ].map(({ label, cmd }) => (
                <button key={label} onClick={cmd} style={actionBtn}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {/* DUA 2.0 */}
        {tab === "dua" && (
          <div style={{ maxWidth: 640 }}>
            <div style={sectionTitle}>CONTROLO DUA 2.0</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={() => sendCommand("CTA_TRIGGER", { variant: "default" })}
                style={{ ...actionBtn, borderColor: "#ff00ff", color: "#ff00ff", background: "rgba(255,0,255,0.08)" }}
              >
                LANCAR MODAL DUA 2.0 — TODOS OS ESPECTADORES
              </button>
              <button
                onClick={() => sendCommand("CTA_TRIGGER", { variant: "urgency" })}
                style={{ ...actionBtn, borderColor: "#ffd700", color: "#ffd700", background: "rgba(255,215,0,0.08)" }}
              >
                MODAL COM URGENCIA (oferta limitada)
              </button>
              <button
                onClick={() => sendCommand("OVERLAY_SHOW", { overlayType: "system_message", message: "Experimenta DUA 2.0 agora — dua.2lados.pt", duration: 8000 })}
                style={actionBtn}
              >
                MOSTRAR LINK DUA 2.0 NO ECRA
              </button>

              <div style={{ marginTop: 16 }}>
                <div style={sectionTitle}>MENSAGEM PERSONALIZADA NO ECRA</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    placeholder="Texto da mensagem..."
                    value={overlayMsg}
                    onChange={(e) => setOverlayMsg(e.target.value)}
                    style={inputStyle}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>DURACAO (segundos)</label>
                      <input
                        type="number"
                        min={2}
                        max={30}
                        value={overlayDuration}
                        onChange={(e) => setOverlayDuration(Number(e.target.value))}
                        style={{ ...inputStyle, width: "100%" }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => showOverlay("system_message")}
                    disabled={!overlayMsg}
                    style={{ ...btnStyle, background: "#00ffcc", color: "#030305", padding: "12px", fontWeight: 700 }}
                  >
                    MOSTRAR NO ECRA
                  </button>
                  <button
                    onClick={() => sendCommand("OVERLAY_HIDE")}
                    style={{ ...btnStyle, background: "transparent", border: "1px solid #333", color: "#666", padding: "12px" }}
                  >
                    LIMPAR OVERLAY
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={sectionTitle}>CONTAGEM DECRESCENTE</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={countdownValue}
                    onChange={(e) => setCountdownValue(Number(e.target.value))}
                    style={{ ...inputStyle, width: 80 }}
                  />
                  <button
                    onClick={() => showOverlay("countdown")}
                    style={{ ...btnStyle, background: "#9b59b6", color: "#fff", padding: "0 20px", fontWeight: 700, flex: 1 }}
                  >
                    INICIAR CONTAGEM
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EMERGENCIA */}
        {tab === "emergencia" && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ ...sectionTitle, color: "#ff4466" }}>PAINEL DE EMERGENCIA</div>
            <div
              style={{
                background: "rgba(255,68,102,0.05)",
                border: "1px solid rgba(255,68,102,0.2)",
                borderRadius: 12,
                padding: 24,
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 11, color: "#ff4466", letterSpacing: 2, marginBottom: 16 }}>
                ACOES DE ALTO IMPACTO — AFECTAM TODOS OS ESPECTADORES
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  onClick={() => sendCommand("EMERGENCY_PAUSE")}
                  style={{
                    ...btnStyle,
                    background: "rgba(255,68,102,0.2)",
                    border: "2px solid rgba(255,68,102,0.6)",
                    color: "#ff4466",
                    padding: "18px",
                    fontSize: 14,
                    letterSpacing: 3,
                  }}
                >
                  PAUSAR TUDO
                </button>
                <button
                  onClick={() => sendCommand("EMERGENCY_RESUME")}
                  style={{
                    ...btnStyle,
                    background: "rgba(0,255,100,0.1)",
                    border: "2px solid rgba(0,255,100,0.4)",
                    color: "#00ff88",
                    padding: "18px",
                    fontSize: 14,
                    letterSpacing: 3,
                  }}
                >
                  RETOMAR
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                {
                  label: "MUSICA DE INTERVALO",
                  action: () => sendCommand("OVERLAY_SHOW", { overlayType: "system_message", message: "Intervalo — voltamos ja!", duration: 120000 }),
                },
                {
                  label: "AGUARDA — TECNICO",
                  action: () => sendCommand("OVERLAY_SHOW", { overlayType: "system_message", message: "A resolver problema tecnico. Aguarda...", duration: 60000 }),
                },
                {
                  label: "LIMPAR TODOS OS OVERLAYS",
                  action: () => sendCommand("OVERLAY_HIDE"),
                },
                {
                  label: "CONCERTO ENCERRADO",
                  action: () => {
                    sendCommand("PHASE_CHANGE", { phase: "finale" });
                    sendCommand("OVERLAY_SHOW", { overlayType: "system_message", message: "Obrigado por fazerem parte desta noite. Ate breve!", duration: 30000 });
                  },
                },
              ].map(({ label, action }) => (
                <button key={label} onClick={action} style={actionBtn}>{label}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 10,
  color: "#555",
  letterSpacing: 3,
  marginBottom: 16,
  textTransform: "uppercase",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: "none",
  borderRadius: 8,
  fontSize: 11,
  fontFamily: "Orbitron, sans-serif",
  letterSpacing: 1,
  cursor: "pointer",
  transition: "all 0.15s",
};

const actionBtn: React.CSSProperties = {
  ...btnStyle,
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#aaa",
  padding: "14px 20px",
  width: "100%",
  textAlign: "left" as const,
  fontSize: 12,
  letterSpacing: 2,
};

const inputStyle: React.CSSProperties = {
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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 9,
  color: "#555",
  letterSpacing: 2,
  marginBottom: 6,
};
