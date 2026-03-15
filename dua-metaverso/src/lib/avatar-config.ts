import type { AvatarStyle } from "@/types/user";
import type { AvatarBody } from "@/types/user";

export interface AvatarStyleConfig {
  id: AvatarStyle;
  label: string;
  skin: string;
  clothing: string;
  accent: string;
  ringOpacity: number;
}

export const AVATAR_STYLES: Record<AvatarStyle, AvatarStyleConfig> = {
  URBAN: {
    id: "URBAN",
    label: "Urban",
    skin: "#4a2c14",
    clothing: "#1a1a2e",
    accent: "#00ffcc",
    ringOpacity: 0.2,
  },
  AFRO: {
    id: "AFRO",
    label: "Afro",
    skin: "#2d1610",
    clothing: "#8b1a00",
    accent: "#fbbf24",
    ringOpacity: 0.2,
  },
  COSMIC: {
    id: "COSMIC",
    label: "Cosmic",
    skin: "#3b2219",
    clothing: "#2d2d4e",
    accent: "#c084fc",
    ringOpacity: 0.2,
  },
} as const;

export const AVATAR_STYLE_IDS: AvatarStyle[] = ["URBAN", "AFRO", "COSMIC"];

// Map body ID to AvatarStyle for backward compat
export function bodyToStyle(body: AvatarBody): AvatarStyle {
  const map: Record<AvatarBody, AvatarStyle> = { "1": "URBAN", "2": "AFRO", "3": "COSMIC" };
  return map[body];
}
