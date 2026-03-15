"use client";

import { useEffect } from "react";

type MetricRating = "good" | "needs-improvement" | "poor";

interface WebVitalMetric {
  name: string;
  value: number;
  rating: MetricRating;
  navigationType: string;
}

function sendVital(metric: WebVitalMetric) {
  const payload = {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
    url: typeof window !== "undefined" ? window.location.href : "unknown",
    timestamp: new Date().toISOString(),
  };

  try {
    const body = JSON.stringify(payload);
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/vitals", blob);
    } else {
      fetch("/api/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Vitals reporting must never throw
  }
}

function getRating(name: string, value: number): MetricRating {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
    INP: [200, 500],
  };
  const [good, poor] = thresholds[name] ?? [Infinity, Infinity];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

function getNavigationType(): string {
  if (typeof performance === "undefined") return "unknown";
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return nav?.type ?? "unknown";
}

function observePaint(name: string, entryName: string) {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === entryName) {
          const value = entry.startTime;
          sendVital({
            name,
            value,
            rating: getRating(name, value),
            navigationType: getNavigationType(),
          });
          observer.disconnect();
        }
      }
    });
    observer.observe({ type: "paint", buffered: true });
  } catch {
    // Observer not supported
  }
}

function observeLCP() {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    let lastValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        lastValue = entry.startTime;
      }
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });

    // Report on page hide (LCP finalizes when page becomes hidden)
    const report = () => {
      if (lastValue > 0) {
        sendVital({
          name: "LCP",
          value: lastValue,
          rating: getRating("LCP", lastValue),
          navigationType: getNavigationType(),
        });
      }
      observer.disconnect();
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") report();
    }, { once: true });
  } catch {
    // Observer not supported
  }
}

function observeCLS() {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      }
    });
    observer.observe({ type: "layout-shift", buffered: true });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        sendVital({
          name: "CLS",
          value: clsValue,
          rating: getRating("CLS", clsValue),
          navigationType: getNavigationType(),
        });
        observer.disconnect();
      }
    }, { once: true });
  } catch {
    // Observer not supported
  }
}

function observeFID() {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as PerformanceEntry & { processingStart: number };
        const value = fidEntry.processingStart - entry.startTime;
        sendVital({
          name: "FID",
          value,
          rating: getRating("FID", value),
          navigationType: getNavigationType(),
        });
        observer.disconnect();
      }
    });
    observer.observe({ type: "first-input", buffered: true });
  } catch {
    // Observer not supported
  }
}

function observeINP() {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    let maxDuration = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const eventEntry = entry as PerformanceEntry & { processingStart: number; processingEnd: number };
        const duration = eventEntry.processingEnd - eventEntry.processingStart;
        if (duration > maxDuration) maxDuration = duration;
      }
    });
    observer.observe({ type: "event", buffered: true });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && maxDuration > 0) {
        sendVital({
          name: "INP",
          value: maxDuration,
          rating: getRating("INP", maxDuration),
          navigationType: getNavigationType(),
        });
        observer.disconnect();
      }
    }, { once: true });
  } catch {
    // Observer not supported
  }
}

function measureTTFB() {
  if (typeof performance === "undefined") return;
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      const value = nav.responseStart - nav.requestStart;
      sendVital({
        name: "TTFB",
        value,
        rating: getRating("TTFB", value),
        navigationType: nav.type,
      });
    }
  } catch {
    // Not available
  }
}

let initialized = false;

export function useVitals() {
  useEffect(() => {
    if (initialized) return;
    initialized = true;

    observePaint("FCP", "first-contentful-paint");
    observeLCP();
    observeCLS();
    observeFID();
    observeINP();
    measureTTFB();
  }, []);
}
