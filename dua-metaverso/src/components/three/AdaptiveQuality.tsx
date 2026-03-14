"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useFrame } from "@react-three/fiber";

interface QualitySettings {
  level: "low" | "medium" | "high";
  moonDetail: number;
  stageDetail: number;
  particleCount: number;
  avatarDetail: number;
  enablePostProcessing: boolean;
  enableAO: boolean;
  enableDOF: boolean;
  shadowMapSize: number;
}

const QUALITY_PRESETS: Record<"low" | "medium" | "high", QualitySettings> = {
  low: {
    level: "low",
    moonDetail: 64,
    stageDetail: 64,
    particleCount: 100,
    avatarDetail: 8,
    enablePostProcessing: true,
    enableAO: false,
    enableDOF: false,
    shadowMapSize: 512,
  },
  medium: {
    level: "medium",
    moonDetail: 96,
    stageDetail: 96,
    particleCount: 200,
    avatarDetail: 12,
    enablePostProcessing: true,
    enableAO: false,
    enableDOF: false,
    shadowMapSize: 1024,
  },
  high: {
    level: "high",
    moonDetail: 128,
    stageDetail: 128,
    particleCount: 300,
    avatarDetail: 16,
    enablePostProcessing: true,
    enableAO: true,
    enableDOF: true,
    shadowMapSize: 2048,
  },
};

const QualityContext = createContext<QualitySettings>(QUALITY_PRESETS.high);

export function useQuality() {
  return useContext(QualityContext);
}

function detectDeviceCapability(): "low" | "medium" | "high" {
  if (typeof window === "undefined") return "medium";

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) return "low";

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  if (!gl) return "low";

  const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
  if (debugInfo) {
    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    if (typeof renderer === "string" && (renderer.includes("Intel") || renderer.includes("Mali"))) {
      return "medium";
    }
  }

  return "high";
}

export function AdaptiveQualityProvider({ children }: { children: ReactNode }) {
  const [quality, setQuality] = useState<QualitySettings>(() => {
    const detected = detectDeviceCapability();
    return QUALITY_PRESETS[detected];
  });

  return <QualityContext.Provider value={quality}>{children}</QualityContext.Provider>;
}

export function PerformanceMonitor() {
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(0);
  const qualityContext = useContext(QualityContext);

  useFrame((_, delta) => {
    const frameTime = delta * 1000;
    frameTimesRef.current.push(frameTime);

    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    const now = performance.now();
    if (now - lastTimeRef.current > 3000 && frameTimesRef.current.length >= 60) {
      lastTimeRef.current = now;

      const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const fps = 1000 / avgFrameTime;

      if (fps < 45 && qualityContext.level !== "low") {
        console.log(`[Performance] FPS: ${fps.toFixed(1)} - Consider reducing quality`);
      } else if (fps > 55 && qualityContext.level === "low") {
        console.log(`[Performance] FPS: ${fps.toFixed(1)} - Could increase quality`);
      }
    }
  });

  return null;
}
