import type { ArtistSlot, AudioMode, ConcertCommand, ConcertState, CommandType } from "@/types/artist";
import { defaultArtistSlots } from "@/lib/artist-registry";

type BroadcastFn = (cmd: ConcertCommand) => void;

class ConcertStore {
  state: ConcertState = {
    phase: "opening",
    artists: defaultArtistSlots(),
    audioMode: "silence",
    isPaused: false,
    phaseStartedAt: Date.now(),
    commandLog: [],
  };

  private subscribers = new Set<BroadcastFn>();
  private rateLimits = new Map<string, number[]>();
  viewerPeak = 0;
  activeViewers = 0;
  messagesTotal = 0;
  reactionsTotal = 0;
  ctaClicks = 0;
  concertStart = Date.now();

  subscribe(fn: BroadcastFn): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  checkRate(id: string): boolean {
    const now = Date.now();
    const times = (this.rateLimits.get(id) ?? []).filter(t => now - t < 60_000);
    if (times.length >= 60) return false;
    times.push(now);
    this.rateLimits.set(id, times);
    return true;
  }

  dispatch(type: CommandType, payload: Record<string, unknown> = {}, by = "host"): void {
    const cmd: ConcertCommand = { type, payload, timestamp: Date.now(), emittedBy: by };
    this.state.commandLog = [...this.state.commandLog.slice(-99), cmd];
    this.apply(cmd);
    this.subscribers.forEach(fn => fn(cmd));
  }

  private apply(cmd: ConcertCommand): void {
    const p = cmd.payload ?? {};
    switch (cmd.type) {
      case "PHASE_CHANGE":
        this.state = { ...this.state, phase: p.phase as string, phaseStartedAt: Date.now() };
        break;
      case "ARTIST_ENTER": {
        const artists = this.state.artists.map(a =>
          a.id === p.artistId ? { ...a, status: "em_palco" as const, defaultPosition: (p.position as ArtistSlot["defaultPosition"]) ?? a.defaultPosition } : a
        );
        this.state = { ...this.state, artists, spotlight: p.artistId as string };
        break;
      }
      case "ARTIST_EXIT": {
        const artists = this.state.artists.map(a =>
          a.id === p.artistId ? { ...a, status: "saiu" as const } : a
        );
        this.state = { ...this.state, artists, spotlight: this.state.spotlight === p.artistId ? undefined : this.state.spotlight };
        break;
      }
      case "SPOTLIGHT":
        this.state = { ...this.state, spotlight: p.artistId as string | undefined };
        break;
      case "AUDIO_SOURCE":
        this.state = { ...this.state, audioMode: p.mode as AudioMode, audioUrl: p.url as string | undefined };
        break;
      case "OVERLAY_SHOW":
        this.state = { ...this.state, activeOverlay: { type: p.overlayType as import("@/types/artist").OverlayType, data: p, expiresAt: p.duration ? Date.now() + (p.duration as number) : undefined } };
        break;
      case "OVERLAY_HIDE":
        this.state = { ...this.state, activeOverlay: undefined };
        break;
      case "CTA_TRIGGER":
        this.ctaClicks++;
        break;
      case "EMERGENCY_PAUSE":
        this.state = { ...this.state, isPaused: true };
        break;
      case "EMERGENCY_RESUME":
        this.state = { ...this.state, isPaused: false };
        break;
      default:
        break;
    }
  }

  trackViewer(delta: number): void {
    this.activeViewers = Math.max(0, this.activeViewers + delta);
    if (this.activeViewers > this.viewerPeak) this.viewerPeak = this.activeViewers;
  }

  updateArtist(id: string, updates: Partial<ArtistSlot>): void {
    this.state = { ...this.state, artists: this.state.artists.map(a => a.id === id ? { ...a, ...updates } : a) };
  }
}

const g = globalThis as typeof globalThis & { _concertStore?: ConcertStore };
if (!g._concertStore) g._concertStore = new ConcertStore();
export const concertStore = g._concertStore;
