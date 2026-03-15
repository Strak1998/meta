"use client";

import { MessageSquare, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { ConcertPhase } from "@/types/artist";

interface SidebarProps {
  messages: { id: string; user: string; text: string; ts: number; flag?: string; accentColor?: string }[];
  onSend: (text: string) => Promise<void>;
  onReaction: (emoji: string) => Promise<void>;
  isHost: boolean;
  concertPhase: ConcertPhase;
  onPhaseChange: (phase: ConcertPhase) => void;
  onTriggerConversion: () => void;
}

const PHASES: { id: ConcertPhase; label: string }[] = [
  { id: "opening", label: "Abertura" },
  { id: "dua2_presentation", label: "DUA 2.0" },
  { id: "vado_performance", label: "Vado MKA" },
  { id: "uzzy_performance", label: "Uzzy" },
  { id: "estraca_performance", label: "Estraca" },
  { id: "finale", label: "Finale" },
];

const REACTIONS = [
  { label: "FOGO", color: "#ff4400" },
  { label: "AMOR", color: "#ff69b4" },
  { label: "LUA", color: "#c084fc" },
  { label: "NOTA", color: "#fbbf24" },
];

const MAX_CHARS = 200;

const tabLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-orbitron, Orbitron, sans-serif)",
  fontWeight: 400,
  fontSize: 9,
  letterSpacing: "0.3em",
  textTransform: "uppercase",
};

export default function Sidebar({
  messages,
  onSend,
  onReaction,
  isHost,
  concertPhase,
  onPhaseChange,
  onTriggerConversion,
}: SidebarProps) {
  const [inputMsg, setInputMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "queue" | "host">("chat");
  const [charWarn, setCharWarn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 40;
  };

  const handleSubmit = () => {
    if (!inputMsg.trim()) return;
    onSend(inputMsg.slice(0, MAX_CHARS));
    setInputMsg("");
    setCharWarn(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS) {
      setCharWarn(true);
      setInputMsg(val.slice(0, MAX_CHARS));
    } else {
      setCharWarn(val.length > MAX_CHARS - 20);
      setInputMsg(val);
    }
  };

  const isDuaBot = (user: string) => user === "DUA Bot" || user === "Sistema";

  const tabs = [
    { id: "chat" as const, label: "CHAT" },
    { id: "queue" as const, label: "FILA" },
    ...(isHost ? [{ id: "host" as const, label: "HOST" }] : []),
  ];

  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        borderLeft: "var(--glass-border)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", padding: "0 16px" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              ...tabLabelStyle,
              flex: 1,
              padding: "12px 0",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === t.id ? "1px solid var(--accent-primary)" : "1px solid transparent",
              color: activeTab === t.id ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "color var(--duration-base), border-color var(--duration-base)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chat tab */}
      {activeTab === "chat" && (
        <>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{ flex: 1, overflowY: "auto", padding: 12, scrollBehavior: "smooth" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((msg) => {
                const isBot = isDuaBot(msg.user);
                return (
                  <div key={msg.id} style={{ fontFamily: "var(--font-montserrat, Montserrat, sans-serif)", fontSize: 13, fontStyle: isBot ? "italic" : "normal" }}>
                    {msg.flag && <span style={{ marginRight: 4 }}>{msg.flag}</span>}
                    <span style={{ fontWeight: 600, color: isBot ? "var(--text-secondary)" : msg.accentColor || "#67e8f9", marginRight: 6 }}>{msg.user}:</span>
                    <span style={{ color: isBot ? "var(--text-secondary)" : "var(--text-primary)" }}>{msg.text}</span>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 40, textAlign: "center", opacity: 0.3 }}>
                  <MessageSquare style={{ width: 32, height: 32, marginBottom: 8, color: "var(--text-muted)" }} />
                  <p style={{ fontFamily: "var(--font-montserrat, Montserrat, sans-serif)", fontSize: 12, color: "var(--text-muted)" }}>O chat esta silencioso.<br />Se o primeiro a falar.</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "12px 16px" }}>
            {/* Reactions */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 10 }}>
              {REACTIONS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => onReaction(r.label)}
                  style={{
                    fontFamily: "var(--font-orbitron, Orbitron, sans-serif)",
                    fontWeight: 400,
                    fontSize: 8,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase" as const,
                    color: "var(--text-muted)",
                    background: "transparent",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "6px 10px",
                    cursor: "pointer",
                    transition: "border-color var(--duration-fast), color var(--duration-fast)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-active)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {/* Input */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  value={inputMsg}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Mensagem"
                  rows={1}
                  style={{
                    width: "100%",
                    resize: "none",
                    height: 36,
                    background: "transparent",
                    border: "none",
                    padding: "8px 0",
                    fontFamily: "var(--font-montserrat, Montserrat, sans-serif)",
                    fontSize: 13,
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
                {charWarn && (
                  <span style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-montserrat, Montserrat, sans-serif)", fontSize: 9, color: "var(--accent-tertiary)" }}>
                    {inputMsg.length}/{MAX_CHARS}
                  </span>
                )}
              </div>
              <button
                onClick={handleSubmit}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  transition: "color var(--duration-fast)",
                  color: "var(--text-muted)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-primary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <ChevronRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Queue tab */}
      {activeTab === "queue" && (
        <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ border: "1px solid rgba(192,132,252,0.2)", background: "rgba(192,132,252,0.05)", borderRadius: "var(--radius-md)", padding: 16, textAlign: "center" }}>
            <p style={{ ...tabLabelStyle, color: "var(--text-muted)", marginBottom: 4 }}>A TOCAR AGORA</p>
            <p style={{ fontFamily: "var(--font-montserrat, Montserrat, sans-serif)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 8 }}>DUA - Rap Cosmico IA</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "var(--radius-full)", background: "var(--accent-secondary)", boxShadow: "0 0 6px var(--accent-secondary)" }} />
              <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--accent-secondary)" }}>128 BPM</span>
            </div>
          </div>
          <p style={{ ...tabLabelStyle, color: "var(--text-muted)", marginTop: 8 }}>PROXIMAS NA FILA</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { title: "Crioulo Drill 2026", by: "Carlos", dur: "2:14" },
              { title: "Kizomba Espacial", by: "Maria", dur: "3:30", dim: true },
            ].map((t) => (
              <div key={t.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", opacity: t.dim ? 0.5 : 1 }}>
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat, Montserrat, sans-serif)", fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{t.title}</p>
                  <p style={{ fontFamily: "var(--font-montserrat, Montserrat, sans-serif)", fontSize: 10, color: "var(--accent-primary)" }}>Pedida por: {t.by}</p>
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{t.dur}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Host tab */}
      {activeTab === "host" && isHost && (
        <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ ...tabLabelStyle, color: "var(--text-muted)" }}>MAESTRO DE FASES</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {PHASES.map((p) => (
              <button
                key={p.id}
                onClick={() => onPhaseChange(p.id)}
                style={{
                  ...tabLabelStyle,
                  fontSize: 9,
                  padding: "10px 8px",
                  background: concertPhase === p.id ? "rgba(0,255,204,0.08)" : "transparent",
                  border: `1px solid ${concertPhase === p.id ? "var(--border-active)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--radius-md)",
                  color: concertPhase === p.id ? "var(--accent-primary)" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all var(--duration-base)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16, borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
            <button
              onClick={onTriggerConversion}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-orbitron, Orbitron, sans-serif)",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "var(--bg-base)",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              Activar Modal de Conversao
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
