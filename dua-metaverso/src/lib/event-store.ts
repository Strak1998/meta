import type {
  ArtistSlot,
  AudioMode,
  ConcertCommand,
  ConcertState,
  CommandType,
  OverlayType,
} from "@/types/artist";
import { defaultArtistSlots } from "@/lib/artist-registry";

type SSEWriter = {
  id: string;
  controller: ReadableStreamDefaultController;
};

type Listener = (command: ConcertCommand) => void;

interface AnalyticsState {
  viewerPeak: number;
  messagesTotal: number;
  reactionsTotal: number;
  ctaClicks: number;
  concertStartedAt: number;
  phaseStats: Record<string, { enteredAt: number; duration: number; ctaClicks: number }>;
}

class ConcertEventStore {
  private state: ConcertState;
  private analytics: AnalyticsState;
  private sseClients: Map<string, SSEWriter> = new Map();
  private listeners: Set<Listener> = new Set();
  private commandLog: ConcertCommand[] = [];
  private rateLimitMap: Map<string, number[]> = new Map();

  constructor() {
    this.state = {
      phase: "opening",
      artists: defaultArtistSlots(),
      audioMode: "silence",
      audioUrl: undefined,
      activeOverlay: undefined,
      spotlight: undefined,
      isPaused: false,
      phaseStartedAt: Date.now(),
      commandLog: [],
    };
    this.analytics = {
      viewerPeak: 0,
      messagesTotal: 0,
      reactionsTotal: 0,
      ctaClicks: 0,
      concertStartedAt: Date.now(),
      phaseStats: {
        opening: { enteredAt: Date.now(), duration: 0, ctaClicks: 0 },
      },
    };
  }

  getState(): ConcertState {
    return { ...this.state, commandLog: [...this.commandLog.slice(-50)] };
  }

  getAnalytics(): AnalyticsState & { activeViewers: number } {
    return {
      ...this.analytics,
      activeViewers: this.sseClients.size,
    };
  }

  checkRateLimit(identity: string): boolean {
    const now = Date.now();
    const window = 60_000;
    const limit = 60;
    const timestamps = this.rateLimitMap.get(identity) ?? [];
    const recent = timestamps.filter((t) => now - t < window);
    if (recent.length >= limit) return false;
    recent.push(now);
    this.rateLimitMap.set(identity, recent);
    return true;
  }

  dispatch(type: CommandType, payload: Record<string, unknown> = {}, emittedBy = "host"): void {
    const command: ConcertCommand = { type, payload, timestamp: Date.now(), emittedBy };
    this.commandLog.push(command);
    if (this.commandLog.length > 500) this.commandLog.shift();

    this.applyCommand(command);
    this.broadcast(command);
    this.listeners.forEach((fn) => fn(command));
  }

  private applyCommand(cmd: ConcertCommand): void {
    const p = cmd.payload ?? {};
    switch (cmd.type) {
      case "PHASE_CHANGE": {
        const prev = this.state.phase;
        const stat = this.analytics.phaseStats[prev];
        if (stat) stat.duration = Date.now() - stat.enteredAt;
        this.state.phase = p.phase as string;
        this.state.phaseStartedAt = Date.now();
        this.analytics.phaseStats[this.state.phase] = {
          enteredAt: Date.now(),
          duration: 0,
          ctaClicks: 0,
        };
        break;
      }
      case "ARTIST_ENTER": {
        const slot = this.state.artists.find((a) => a.id === p.artistId);
        if (slot) {
          slot.status = "em_palco";
          if (p.position) slot.defaultPosition = p.position as ArtistSlot["defaultPosition"];
        }
        this.state.spotlight = p.artistId as string;
        break;
      }
      case "ARTIST_EXIT": {
        const slot = this.state.artists.find((a) => a.id === p.artistId);
        if (slot) slot.status = "saiu";
        if (this.state.spotlight === p.artistId) this.state.spotlight = undefined;
        break;
      }
      case "SPOTLIGHT":
        this.state.spotlight = p.artistId as string | undefined;
        break;
      case "AUDIO_SOURCE":
        this.state.audioMode = p.mode as AudioMode;
        this.state.audioUrl = p.url as string | undefined;
        break;
      case "OVERLAY_SHOW":
        this.state.activeOverlay = {
          type: p.overlayType as OverlayType,
          data: p as Record<string, unknown>,
          expiresAt: p.duration ? Date.now() + (p.duration as number) : undefined,
        };
        break;
      case "OVERLAY_HIDE":
        this.state.activeOverlay = undefined;
        break;
      case "CTA_TRIGGER":
        this.analytics.ctaClicks++;
        if (this.analytics.phaseStats[this.state.phase]) {
          this.analytics.phaseStats[this.state.phase].ctaClicks++;
        }
        break;
      case "EMERGENCY_PAUSE":
        this.state.isPaused = true;
        break;
      case "EMERGENCY_RESUME":
        this.state.isPaused = false;
        break;
      default:
        break;
    }
  }

  private broadcast(command: ConcertCommand): void {
    const data = `data: ${JSON.stringify(command)}\n\n`;
    const dead: string[] = [];
    this.sseClients.forEach((client, id) => {
      try {
        client.controller.enqueue(new TextEncoder().encode(data));
      } catch {
        dead.push(id);
      }
    });
    dead.forEach((id) => this.sseClients.delete(id));
  }

  addSSEClient(id: string, controller: ReadableStreamDefaultController): void {
    this.sseClients.set(id, { id, controller });
    const viewers = this.sseClients.size;
    if (viewers > this.analytics.viewerPeak) this.analytics.viewerPeak = viewers;
  }

  removeSSEClient(id: string): void {
    this.sseClients.delete(id);
  }

  sendInitToClient(controller: ReadableStreamDefaultController): void {
    const initCmd: ConcertCommand = {
      type: "PHASE_CHANGE",
      payload: { init: true, state: this.getState() },
      timestamp: Date.now(),
    };
    const data = `data: ${JSON.stringify(initCmd)}\n\n`;
    controller.enqueue(new TextEncoder().encode(data));
  }

  recordMessage(): void {
    this.analytics.messagesTotal++;
  }

  recordReaction(): void {
    this.analytics.reactionsTotal++;
  }

  updateArtist(artistId: string, updates: Partial<ArtistSlot>): void {
    const slot = this.state.artists.find((a) => a.id === artistId);
    if (slot) Object.assign(slot, updates);
  }

  addArtist(slot: ArtistSlot): void {
    const existing = this.state.artists.findIndex((a) => a.id === slot.id);
    if (existing >= 0) {
      this.state.artists[existing] = slot;
    } else {
      this.state.artists.push(slot);
    }
  }
}

const globalForStore = globalThis as typeof globalThis & {
  _concertEventStore?: ConcertEventStore;
};

if (!globalForStore._concertEventStore) {
  globalForStore._concertEventStore = new ConcertEventStore();
}

export const concertStore = globalForStore._concertEventStore;
