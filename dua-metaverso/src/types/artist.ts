export type ArtistStatus = "aguarda" | "pronto" | "em_palco" | "saiu";
export type ArtistPosition = "esquerda" | "centro" | "direita";

// Alias kept for code that uses the older name
export type StagePosition = ArtistPosition;

export interface ArtistSlot {
  id: string;
  name: string;
  status: ArtistStatus;
  defaultPosition: ArtistPosition;
  skinColor: string;
  clothingColor: string;
  accentColor: string;
  bio?: string;
  avatarGlbUrl?: string;
  entryAnimationDuration?: number;
  entryMusicUrl?: string;
}

export type AudioMode = "microphone" | "stream" | "file" | "silence";

export type OverlayType =
  | "countdown"
  | "cta"
  | "message"
  | "poll"
  | "leaderboard"
  | "sponsor"
  | "emergency"
  | "system_message";

export type CommandType =
  | "PHASE_CHANGE"
  | "ARTIST_ENTER"
  | "ARTIST_EXIT"
  | "SPOTLIGHT"
  | "AUDIO_SOURCE"
  | "CHAT_HIGHLIGHT"
  | "CHAT_BROADCAST"
  | "CTA_TRIGGER"
  | "OVERLAY_SHOW"
  | "OVERLAY_HIDE"
  | "CONFETTI"
  | "EMERGENCY_PAUSE"
  | "EMERGENCY_RESUME";

// Legacy alias kept for backward compatibility
export type ConcertCommandType = CommandType;

export interface ConcertCommand {
  id?: string;
  type: CommandType;
  /** Unix timestamp in ms — preferred field name */
  timestamp?: number;
  /** Legacy alias for timestamp (kept for backward compatibility) */
  ts?: number;
  emittedBy?: string;
  payload?: {
    colors?: string[];
    intensity?: "low" | "high";
    phase?: string;
    [key: string]: unknown;
  };
}

export interface ActiveOverlay {
  type: OverlayType;
  data: Record<string, unknown>;
  expiresAt?: number;
}

export interface ConcertState {
  phase: string;
  artists: ArtistSlot[];
  commandLog: ConcertCommand[];
  audioMode?: AudioMode;
  audioUrl?: string;
  activeOverlay?: ActiveOverlay;
  spotlight?: string;
  isPaused?: boolean;
  phaseStartedAt?: number;
}

export const DEFAULT_CONCERT_STATE: ConcertState = {
  phase: "opening",
  artists: [
    { id: "vado", name: "\uD83C\uDFA4 VADO MKA", status: "aguarda", defaultPosition: "esquerda", skinColor: "#3b2219", clothingColor: "#ff4400", accentColor: "#ff6600" },
    { id: "uzzy", name: "\uD83C\uDFA4 UZZY", status: "aguarda", defaultPosition: "direita", skinColor: "#4a2c14", clothingColor: "#2244ff", accentColor: "#4488ff" },
    { id: "estraca", name: "\uD83C\uDFA4 ESTRACA", status: "aguarda", defaultPosition: "centro", skinColor: "#291711", clothingColor: "#ffd700", accentColor: "#ffaa00" },
  ],
  commandLog: [],
  audioMode: "silence",
  isPaused: false,
  phaseStartedAt: 0,
};
