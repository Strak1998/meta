"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const from = params.get("from") ?? "/backstage";
        router.push(from);
      } else {
        const data = await res.json();
        setError(data.error ?? "Credenciais invalidas");
      }
    } catch {
      setError("Erro de ligacao. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030305",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Orbitron, sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.85)",
          border: "1px solid rgba(0,255,204,0.3)",
          borderRadius: 16,
          padding: "48px 40px",
          width: 380,
          boxShadow: "0 0 60px rgba(0,255,204,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "#00ffcc", letterSpacing: 4, marginBottom: 8 }}>
            DUA METAVERSO
          </div>
          <div style={{ fontSize: 22, color: "#ffffff", fontWeight: 700, letterSpacing: 2 }}>
            BACKSTAGE
          </div>
          <div style={{ width: 40, height: 2, background: "#00ffcc", margin: "12px auto 0" }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{ display: "block", fontSize: 10, color: "#888", letterSpacing: 2, marginBottom: 8 }}
            >
              PASSWORD DE ACESSO
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              placeholder="••••••••"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(0,255,204,0.2)",
                borderRadius: 8,
                padding: "12px 16px",
                color: "#fff",
                fontSize: 16,
                outline: "none",
                fontFamily: "monospace",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: "rgba(255,68,102,0.15)",
                border: "1px solid rgba(255,68,102,0.4)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#ff4466",
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              background: loading ? "rgba(0,255,204,0.3)" : "#00ffcc",
              color: "#030305",
              border: "none",
              borderRadius: 8,
              padding: "14px",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "Orbitron, sans-serif",
              letterSpacing: 2,
              cursor: loading || !password ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {loading ? "A VERIFICAR..." : "ENTRAR"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#444" }}>
          Acesso restrito ao host do concerto
        </div>
      </div>
    </div>
  );
}

export default function BackstageLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
