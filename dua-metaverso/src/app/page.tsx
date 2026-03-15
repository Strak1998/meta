"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import confetti from "canvas-confetti";
import TopBar from "@/components/layout/TopBar";
import LoadingScreen from "@/components/layout/LoadingScreen";
import HeroOverlay from "@/components/three/HeroOverlay";
import MusicModal from "@/components/music/MusicModal";
import WaveformVisualizer from "@/components/music/WaveformVisualizer";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import Footer from "@/components/layout/Footer";
import ReactionsOverlay from "@/components/layout/ReactionsOverlay";
import CTAButton from "@/components/layout/CTAButton";
import ConversionModal from "@/components/layout/ConversionModal";
import { LiveOverlay } from "@/components/overlays/LiveOverlay";
import { useLiveChat } from "@/lib/use-live-chat";
import { useConcertEvents } from "@/hooks/useConcertEvents";
import { useErrorTracking } from "@/hooks/useErrorTracking";
import { useVitals } from "@/hooks/useVitals";
import { useInactivity } from "@/hooks/useInactivity";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { ConcertCommand } from "@/types/artist";
import type { UserProfile } from "@/types/user";

const MoonScene = dynamic(() => import("@/components/three/MoonScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#030305]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="skeleton" style={{ width: 120, height: 120, borderRadius: "50%" }} />
      </div>
    </div>
  ),
});

const Sidebar = dynamic(() => import("@/components/layout/Sidebar"), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-xl" />,
});

const VoiceRoom = dynamic(() => import("@/components/voice/VoiceRoom"), {
  ssr: false,
  loading: () => <div className="skeleton h-32 w-full rounded-xl" />,
});

import type { ConcertPhase } from "@/types/artist";

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

const VALID_PHASES = new Set(PHASE_ORDER);
function isConcertPhase(s: string): s is ConcertPhase {
  return VALID_PHASES.has(s as ConcertPhase);
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [concertPhase, setConcertPhase] = useState<ConcertPhase>("opening");
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const [conversionModalOpen, setConversionModalOpen] = useState(false);
  const [musicGenerated, setMusicGenerated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [restoringUser, setRestoringUser] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [rendererPaused, setRendererPaused] = useState(false);
  const [phaseTransition, setPhaseTransition] = useState<"idle" | "exit" | "void" | "enter">("idle");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const joined = userProfile !== null;
  const username = userProfile?.name ?? "";

  const { messages, viewers, connected: chatConnected, activeUsers, sendMessage, sendReaction } = useLiveChat(username, userProfile?.avatarStyle, userProfile?.country);
  const { state: concertState, connected: eventConnected } = useConcertEvents();
  const connectionStatus = useConnectionStatus({ chatConnected, eventConnected });
  const sceneAudienceUsers = useMemo(() => {
    const merged = new Map<string, UserProfile>();
    for (const user of activeUsers) {
      merged.set(user.id, user);
    }
    if (userProfile) {
      merged.set(userProfile.id, userProfile);
    }
    return Array.from(merged.values()).sort((a, b) => a.joinedAt - b.joinedAt);
  }, [activeUsers, userProfile]);

  useErrorTracking();
  useVitals();

  useInactivity(
    useCallback(() => setRendererPaused(true), []),
    useCallback(() => setRendererPaused(false), [])
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("host") === "1") setIsHost(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreUser() {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setRestoringUser(false);
          return;
        }

        const user = (await res.json()) as UserProfile;
        if (!cancelled) {
          setUserProfile(user);
          setRestoringUser(false);
        }
      } catch {
        if (!cancelled) setRestoringUser(false);
      }
    }

    restoreUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoadComplete = useCallback(() => setLoading(false), []);

  const handleJoin = useCallback((user: UserProfile) => {
    setUserProfile(user);
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

  const executePhaseTransition = useCallback((newPhase: ConcertPhase) => {
    setPhaseTransition("exit");
    setTimeout(() => {
      setPhaseTransition("void");
      setConcertPhase(newPhase);
      setTimeout(() => {
        setPhaseTransition("enter");
        setTimeout(() => {
          setPhaseTransition("idle");
        }, 1500);
      }, 1000);
    }, 500);
  }, []);

  const handlePhaseChange = useCallback(
    (phase: ConcertPhase) => {
      const prev = concertPhase;
      executePhaseTransition(phase);
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: ["#00ffcc", "#ff00ff", "#ffd700"], ticks: 100 });
      if (CONVERSION_PHASES.includes(prev) && prev !== phase) setConversionModalOpen(true);
    },
    [concertPhase, executePhaseTransition]
  );

  // Sync phase from backstage SSE
  useEffect(() => {
    const p = concertState.phase;
    if (!isConcertPhase(p) || p === concertPhase) return;
    const prev = concertPhase;
    executePhaseTransition(p);
    confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: ["#00ffcc", "#ff00ff", "#ffd700"], ticks: 100 });
    if (CONVERSION_PHASES.includes(prev)) setConversionModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concertState.phase]);

  // Handle backstage commands
  useEffect(() => {
    const log = concertState.commandLog;
    const last = log[log.length - 1] as ConcertCommand | undefined;
    if (!last) return;
    if (last.type === "CONFETTI") {
      const colors = (last.payload?.colors as string[]) ?? ["#00ffcc", "#ff00ff", "#ffd700"];
      confetti({ particleCount: last.payload?.intensity === "high" ? 350 : 200, spread: 150, origin: { y: 0.4 }, colors, ticks: 120 });
    }
    if (last.type === "CTA_TRIGGER") setConversionModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concertState.commandLog.length]);

  // Emergency pause: pause renderer and show overlay
  useEffect(() => {
    setRendererPaused(concertState.isPaused);
  }, [concertState.isPaused]);

  // Auto-timer fallback
  useEffect(() => {
    if (loading || !joined || isHost || eventConnected) return;
    const duration = PHASE_DURATIONS[concertPhase];
    if (duration === Infinity) return;
    const timer = setTimeout(() => {
      const idx = PHASE_ORDER.indexOf(concertPhase);
      const next = PHASE_ORDER[idx + 1];
      if (!next) return;
      if (CONVERSION_PHASES.includes(concertPhase)) {
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: ["#00ffcc", "#ff00ff", "#ffd700"], ticks: 100 });
        setConversionModalOpen(true);
      }
      executePhaseTransition(next);
    }, duration);
    return () => clearTimeout(timer);
  }, [concertPhase, loading, joined, isHost, eventConnected, executePhaseTransition]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable) return;
      if (e.code === "Space") { e.preventDefault(); setMusicModalOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sidebarMessages = messages.map((m) => ({ id: m.id, user: m.user, text: m.text, ts: m.timestamp }));

  const phaseClass = phaseTransition === "exit"
    ? "phase-exit"
    : phaseTransition === "void"
    ? "phase-void"
    : phaseTransition === "enter"
    ? "phase-enter"
    : "";

  return (
    <>
      {loading && <LoadingScreen onComplete={handleLoadComplete} />}
      {!joined && !loading && !restoringUser && <OnboardingScreen onJoin={handleJoin} />}
      <MusicModal open={musicModalOpen} onOpenChange={setMusicModalOpen} onGenerate={handleGenerate} />
      <ConversionModal open={conversionModalOpen} onOpenChange={setConversionModalOpen} />

      <div className={`min-h-screen min-h-[100dvh] bg-[#030305] transition-opacity duration-1000 ${loading ? "opacity-0" : "opacity-100"}`}>
        <TopBar />
        <ReactionsOverlay />
        {joined && <CTAButton concertPhase={concertPhase} />}

        {/* Connection status */}
        <div className="fixed top-3 right-[140px] z-50 flex items-center gap-1.5 sm:right-[200px]">
          <div
            className="connection-indicator"
            data-status={connectionStatus}
            title={
              connectionStatus === "connected"
                ? "Ligado"
                : connectionStatus === "reconnecting"
                ? "A reconectar..."
                : "Desligado"
            }
          />
          {connectionStatus !== "connected" && (
            <span
              className="text-[10px] tracking-wider font-heading"
              style={{ color: connectionStatus === "reconnecting" ? "var(--color-reconnecting)" : "var(--color-disconnected)" }}
            >
              {connectionStatus === "reconnecting" ? "A RECONECTAR" : "SEM LIGACAO"}
            </span>
          )}
        </div>

        <div className="flex min-h-screen min-h-[100dvh]">
          <main className="flex-1 flex flex-col min-w-0">
            <section
              className={`relative w-full overflow-hidden ${phaseClass}`}
              style={{ height: "100dvh" }}
            >
              {!rendererPaused ? (
                <MoonScene
                  viewerCount={viewers}
                  concertPhase={concertPhase}
                  userProfile={userProfile}
                  audienceUsers={sceneAudienceUsers}
                />
              ) : (
                <div className="absolute inset-0 bg-[#030305] flex items-center justify-center">
                  <p className="text-sm text-white/30 tracking-wider font-heading">PAUSADO</p>
                </div>
              )}
              <HeroOverlay viewerCount={viewers} concertPhase={concertPhase} musicGenerated={musicGenerated} />
              <LiveOverlay concertState={concertState} />
              {concertState.isPaused && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="mb-2 font-heading text-2xl font-black tracking-[0.3em] text-red-400 sm:text-4xl">PAUSA</div>
                    <div className="text-xs tracking-[0.2em] text-white/40">O concerto foi pausado pelo anfitriao</div>
                  </div>
                </div>
              )}
            </section>

            <div className="relative z-10 cosmic-fog">
              <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:space-y-16 sm:py-14 md:px-6">
                <section className="flex flex-col items-center text-center space-y-4">
                  <button
                    onClick={() => setMusicModalOpen(true)}
                    className="interactive neon-border rounded-xl px-8 py-3 font-heading text-xs font-bold tracking-[0.2em] text-cyan-300 sm:px-10 sm:py-4 sm:text-sm"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,255,204,0.06), rgba(255,0,255,0.06))",
                      minHeight: "var(--touch-min)",
                    }}
                  >
                    PEDIR MUSICA
                  </button>
                  <p className="text-[10px] text-white/20 sm:text-xs">
                    Ou pressiona{" "}
                    <kbd className="mx-1 rounded bg-white/8 px-1.5 py-0.5 text-[9px] text-white/35 sm:text-[10px]">Espaco</kbd>{" "}
                    para pedir
                  </p>
                </section>
                <section className="mx-auto max-w-2xl w-full">
                  <WaveformVisualizer active={musicGenerated} />
                </section>
                <section>
                  <h2 className="mb-6 flex items-center gap-3 font-heading text-lg font-black uppercase tracking-[0.15em] text-white text-3d sm:text-xl">
                    <span className="h-px w-8 bg-cyan-400/25 sm:w-10" />
                    Sala ao Vivo
                    <span className="h-px w-8 bg-cyan-400/25 sm:w-10" />
                  </h2>
                  <VoiceRoom username={username} />
                </section>
              </div>
              <Footer />
            </div>
          </main>

          <div className="hidden w-80 shrink-0 p-3 lg:block xl:w-96">
            <div className="sticky top-14" style={{ height: "calc(100dvh - 4rem)" }}>
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

        {/* Mobile chat toggle */}
        {joined && (
          <Sheet open={mobileChatOpen} onOpenChange={setMobileChatOpen}>
            <SheetTrigger
              render={
                <button
                  className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/30 bg-black/80 text-lg backdrop-blur-sm lg:hidden"
                  aria-label="Abrir chat"
                />
              }
            >
              💬
            </SheetTrigger>
            <SheetContent side="left" className="w-80 border-r border-cyan-400/10 bg-[#030305] p-0 sm:w-96">
              <div className="h-full pt-10">
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
            </SheetContent>
          </Sheet>
        )}
      </div>
    </>
  );
}
