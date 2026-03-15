export type ConcertPhase =
  | "opening"
  | "dua2_presentation"
  | "vado_performance"
  | "uzzy_performance"
  | "estraca_performance"
  | "finale";

export type ArtistStatus = "aguarda" | "pronto" | "em_palco" | "saiu";
export type StagePosition = "esquerda" | "centro" | "direita";

export interface ArtistSlot {
  id: string;
  name: string;
  accentColor: string;
  defaultPosition: StagePosition;
  skinColor: string;
  clothingColor: string;
  entryMusicUrl?: string;
  entryAnimationDuration: number;
  status: ArtistStatus;
  bio?: string;
}

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

export type OverlayType =
  | "system_message"
  | "chat_highlight"
  | "countdown"
  | "applause"
  | "artist_name";

export type AudioMode = "microphone" | "stream" | "file" | "silence";

export interface ConcertCommand {
  type: CommandType;
  payload?: Record<string, unknown>;
  timestamp: number;
  emittedBy?: string;
}

export interface ConcertState {
  phase: string;
  artists: ArtistSlot[];
  audioMode: AudioMode;
  audioUrl?: string;
  activeOverlay?: {
    type: OverlayType;
    data: Record<string, unknown>;
    expiresAt?: number;
  };
  spotlight?: string;
  isPaused: boolean;
  phaseStartedAt: number;
  commandLog: ConcertCommand[];
}
