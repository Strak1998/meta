export type ArtistStatus = "aguarda" | "pronto" | "em_palco" | "saiu";
export type ArtistPosition = "esquerda" | "centro" | "direita";

export interface ArtistSlot {
  id: string;
  name: string;
  status: ArtistStatus;
  defaultPosition: ArtistPosition;
  skinColor: string;
  clothingColor: string;
  accentColor: string;
}

export type ConcertCommandType = "CONFETTI" | "CTA_TRIGGER" | "PHASE_CHANGE";

export interface ConcertCommand {
  id: string;
  type: ConcertCommandType;
  ts: number;
  payload?: {
    colors?: string[];
    intensity?: "low" | "high";
    phase?: string;
  };
}

export interface ConcertState {
  phase: string;
  artists: ArtistSlot[];
  commandLog: ConcertCommand[];
}

export const DEFAULT_CONCERT_STATE: ConcertState = {
  phase: "opening",
  artists: [
    { id: "vado", name: "\uD83C\uDFA4 VADO MKA", status: "aguarda", defaultPosition: "esquerda", skinColor: "#3b2219", clothingColor: "#ff4400", accentColor: "#ff6600" },
    { id: "uzzy", name: "\uD83C\uDFA4 UZZY", status: "aguarda", defaultPosition: "direita", skinColor: "#4a2c14", clothingColor: "#2244ff", accentColor: "#4488ff" },
    { id: "estraca", name: "\uD83C\uDFA4 ESTRACA", status: "aguarda", defaultPosition: "centro", skinColor: "#291711", clothingColor: "#ffd700", accentColor: "#ffaa00" },
  ],
  commandLog: [],
};
