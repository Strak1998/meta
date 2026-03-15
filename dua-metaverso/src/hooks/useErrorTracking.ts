"use client";

import { useEffect } from "react";

let installed = false;

function sendError(payload: {
  message: string;
  stack?: string;
  userAgent: string;
  url: string;
  timestamp: string;
}) {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/error", blob);
    } else {
      fetch("/api/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Tracking must never throw
  }
}

function installGlobalHandlers() {
  if (installed) return;
  installed = true;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
  const pageUrl = typeof window !== "undefined" ? window.location.href : "unknown";

  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ) => {
    sendError({
      message: String(message),
      stack: error?.stack ?? `${source ?? "unknown"}:${lineno ?? 0}:${colno ?? 0}`,
      userAgent: ua,
      url: pageUrl,
      timestamp: new Date().toISOString(),
    });
  };

  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
        ? reason
        : "Unhandled promise rejection";
    const stack = reason instanceof Error ? reason.stack : undefined;

    sendError({
      message,
      stack,
      userAgent: ua,
      url: pageUrl,
      timestamp: new Date().toISOString(),
    });
  };
}

export function useErrorTracking() {
  useEffect(() => {
    installGlobalHandlers();
  }, []);
}
