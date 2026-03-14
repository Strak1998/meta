"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import confetti from "canvas-confetti";
import TopBar from "@/components/layout/TopBar";
import LoadingScreen from "@/components/layout/LoadingScreen";
import HeroOverlay from "@/components/three/HeroOverlay";
import VoiceRoom from "@/components/voice/VoiceRoom";
import MusicModal from "@/components/music/MusicModal";
import WaveformVisualizer from "@/components/music/WaveformVisualizer";
import GuestSystem from "@/components/guest/GuestSystem";
import Sidebar from "@/components/sidebar/Sidebar";
import Footer from "@/components/layout/Footer";
import ReactionsOverlay from "@/components/layout/ReactionsOverlay";
import CTAButton from "@/components/layout/CTAButton";
import ConversionModal from "@/components/layout/ConversionModal";
import { LiveOverlay } from "@/components/overlays/LiveOverlay";
import { useLiveChat } from "@/lib/use-live-chat";
import { useConcertEvents } from "@/hooks/useConcertEvents";
import type { ConcertCommand } from "@/types/artist";

import type { ComponentProps } from "react";
import type MoonSceneType from "@/components/three/MoonScene";

const MoonScene = dynamic(() => import("@/components/three/MoonScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#030305]" />,
}) as React.ComponentType<ComponentProps<typeof MoonSceneType>>;

export type ConcertPhase =
  | "opening"
  | "dua2_presentation"
  | "vado_performance"
  | "uzzy_performance"
  | "estraca_performance"
  | "finale";

const PHASE_DURATIONS: Record<ConcertPhase, number> = {
  opening: 18000,
  dua2_presentation: 25000,
  vado_performance: 18000,
  uzzy_performance: 18000,
  estraca_performance: 18000,
  finale: Infinity,
};

const PHASE_ORDER: ConcertPhase[] = [
  "opening",
  "dua2_presentation",
  "vado_performance",
  "uzzy_performance",
  "estraca_performance",
  "finale",
];

const CONVERSION_PHASES: ConcertPhase[] = [
  "dua2_presentation",
  "vado_performance",
  "uzzy_performance",
  "estraca_performance",
];

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [concertPhase, setConcertPhase] = useState<ConcertPhase>("opening");
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const [conversionModalOpen, setConversionModalOpen] = useState(false);
  const [musicGenerated, setMusicGenerated] = useState(false);
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const prevPhaseRef = useRef<ConcertPhase>("opening");
  const { messages, viewers, sendMessage, sendReaction } = useLiveChat(username);
  const { state: concertState, connected: eventConnected } = useConcertEvents();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("host") === "1") setIsHost(true);
  }, []);

  const handleLoadComplete = useCallback(() => setLoading(false), []);

  const handleJoin = useCallback((name: string) => {
    setUsername(name);
    setJoined(true);
  }, []);

  const handleGenerate = useCallback(
    (_prompt: string) => {
      if (!musicGenerated) {
        setMusicGenerated(true);
        confetti({
          particleCount: 250,
          spread: 140,
          origin: { y: 0.5 },
          colors: ["#00ffcc", "#ff00ff", "#ffd700", "#ffffff", "#a855f6"],
          ticks: 120,
        });
      }
    },
    [musicGenerated]
  );

  const handlePhaseChange = useCallback(
    (phase: ConcertPhase) => {
      const prev = concertPhase;
      setConcertPhase(phase);
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.4 },
        colors: ["#00ffcc", "#ff00ff", "#ffd700"],
        ticks: 100,
      });
      /* Don't interrupt music generation with modal */
      if (CONVERSION_PHASES.includes(prev) && prev !== phase && !musicModalOpen) {
        setConversionModalOpen(true);
      }
    },
    [concertPhase, musicModalOpen]
  );

  useEffect(() => {
    const serverPhase = concertState.phase;
    const valid = ["opening","dua2_presentation","vado_performance","uzzy_performance","estraca_performance","finale"].includes(serverPhase);
    if (!valid || serverPhase === concertPhase) return;
    const prev = concertPhase;
    prevPhaseRef.current = prev;
    setConcertPhase(serverPhase as ConcertPhase);
    confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: ["#00ffcc","#ff00ff","#ffd700"], ticks: 100 });
    if (CONVERSION_PHASES.includes(prev) && !musicModalOpen) setConversionModalOpen(true);
  }, [concertState.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const log = concertState.commandLog;
    const lastCmd = log[log.length - 1] as ConcertCommand | undefined;
    if (!lastCmd) return;
    if (lastCmd.type === "CONFETTI") {
      const colors = (lastCmd.payload?.colors as string[]) ?? ["#00ffcc","#ff00ff","#ffd700"];
      confetti({ particleCount: lastCmd.payload?.intensity === "high" ? 350 : 200, spread: 150, origin: { y: 0.4 }, colors, ticks: 120 });
    }
    if (lastCmd.type === "CTA_TRIGGER") setConversionModalOpen(true);
  }, [concertState.commandLog.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loading || !joined || isHost || eventConnected) return;
    const duration = PHASE_DURATIONS[concertPhase];
    if (duration === Infinity) return;
    const timer = setTimeout(() => {
      const idx = PHASE_ORDER.indexOf(concertPhase);
      const nextPhase = PHASE_ORDER[idx + 1];
      if (!nextPhase) return;
      if (CONVERSION_PHASES.includes(concertPhase)) {
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.4 },
          colors: ["#00ffcc", "#ff00ff", "#ffd700"],
          ticks: 100,
        });
        if (!musicModalOpen) setConversionModalOpen(true);
      }
      setConcertPhase(nextPhase);
    }, duration);
    return () => clearTimeout(timer);
  }, [concertPhase, loading, joined, isHost, musicModalOpen, eventConnected]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable) return;
      if (e.code === "Space") {
        e.preventDefault();
        setMusicModalOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sidebarMessages = messages.map((m) => ({
    id: m.id,
    user: m.user,
    text: m.text,
    ts: m.timestamp,
  }));

  return (
    <>
      {loading && <LoadingScreen onComplete={handleLoadComplete} />}
      {!joined && !loading && <GuestSystem onJoin={handleJoin} />}
      <MusicModal open={musicModalOpen} onOpenChange={setMusicModalOpen} onGenerate={handleGenerate} />
      <ConversionModal open={conversionModalOpen} onOpenChange={setConversionModalOpen} />

      <div className={`min-h-screen bg-[#030305] transition-opacity duration-1000 ${loading ? "opacity-0" : "opacity-100"}`}>
        <TopBar />
        <ReactionsOverlay />
        {joined && <CTAButton concertPhase={concertPhase} />}

        <div className="flex min-h-screen">
          <main className="flex-1 flex flex-col min-w-0">
            <section className="relative h-screen min-h-[600px] w-full overflow-hidden">
              <MoonScene viewerCount={viewers} concertPhase={concertPhase} artists={eventConnected ? concertState.artists : undefined} />
              <HeroOverlay viewerCount={viewers} concertPhase={concertPhase} musicGenerated={musicGenerated} />
              <LiveOverlay concertState={concertState} />
            </section>

            <div className="relative z-10 cosmic-fog">
              <div className="mx-auto max-w-5xl space-y-16 px-4 py-14 md:px-6">
                <section className="flex flex-col items-center text-center space-y-4">
                  <button
                    onClick={() => setMusicModalOpen(true)}
                    className="neon-border rounded-xl px-10 py-4 font-heading text-sm font-bold tracking-[0.2em] text-cyan-300 transition-all hover:scale-105 active:scale-95"
                    style={{ background: "linear-gradient(135deg, rgba(0,255,204,0.06), rgba(255,0,255,0.06))" }}
                  >
                    PEDIR MUSICA
                  </button>
                  <p className="text-xs text-white/20">
                    Ou pressiona{" "}
                    <kbd className="mx-1 rounded bg-white/8 px-1.5 py-0.5 text-[10px] text-white/35">Espaco</kbd>{" "}
                    para pedir
                  </p>
                </section>

                <section className="mx-auto max-w-2xl w-full">
                  <WaveformVisualizer active={musicGenerated} />
                </section>

                <section>
                  <h2 className="mb-6 flex items-center gap-3 font-heading text-xl font-black uppercase tracking-[0.15em] text-white text-3d">
                    <span className="h-px w-10 bg-cyan-400/25" />
                    Sala ao Vivo
                    <span className="h-px w-10 bg-cyan-400/25" />
                  </h2>
                  <VoiceRoom username={username} isHost={isHost} />
                </section>
              </div>
              <Footer />
            </div>
          </main>

          <div className="hidden w-80 shrink-0 p-3 lg:block xl:w-96">
            <div className="sticky top-14 h-[calc(100vh-4rem)]">
              <Sidebar
                messages={sidebarMessages}
                onSend={sendMessage}
                onReaction={sendReaction}
                isHost={isHost}
                concertPhase={concertPhase}
                onPhaseChange={handlePhaseChange}
                onTriggerConversion={() => setConversionModalOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
