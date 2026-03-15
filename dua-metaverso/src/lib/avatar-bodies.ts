import type { AvatarBody } from "@/types/user";

export interface BodyConfig {
  id: AvatarBody;
  label: string;
  accent: string;
  clothing: string;
  clothingSecondary: string;
  torsoWidth: number;
  torsoHeight: number;
  shoulderWidth: number;
  legLength: number;
  armLength: number;
  hasShoes: boolean;
  shoeHeight: number;
  hasGloves: boolean;
  emissivePattern: boolean;
  emissiveLines: boolean;
  outfitType: "streetwear" | "dashiki" | "spacesuit";
}

export const BODY_CONFIGS: Record<AvatarBody, BodyConfig> = {
  "1": {
    id: "1",
    label: "Urban Streetwear",
    accent: "#00ffcc",
    clothing: "#1a2a2e",
    clothingSecondary: "#0d1518",
    torsoWidth: 0.17,
    torsoHeight: 0.38,
    shoulderWidth: 0.21,
    legLength: 0.28,
    armLength: 0.34,
    hasShoes: true,
    shoeHeight: 0.06,
    hasGloves: false,
    emissivePattern: false,
    emissiveLines: false,
    outfitType: "streetwear",
  },
  "2": {
    id: "2",
    label: "Afro Cultural",
    accent: "#fbbf24",
    clothing: "#8b4513",
    clothingSecondary: "#5c2e0e",
    torsoWidth: 0.22,
    torsoHeight: 0.42,
    shoulderWidth: 0.26,
    legLength: 0.26,
    armLength: 0.32,
    hasShoes: false,
    shoeHeight: 0,
    hasGloves: false,
    emissivePattern: true,
    emissiveLines: false,
    outfitType: "dashiki",
  },
  "3": {
    id: "3",
    label: "Cosmic Futurista",
    accent: "#c084fc",
    clothing: "#1a1a3e",
    clothingSecondary: "#0d0d22",
    torsoWidth: 0.15,
    torsoHeight: 0.40,
    shoulderWidth: 0.18,
    legLength: 0.30,
    armLength: 0.36,
    hasShoes: true,
    shoeHeight: 0.08,
    hasGloves: true,
    emissivePattern: false,
    emissiveLines: true,
    outfitType: "spacesuit",
  },
};

export const BODY_IDS: AvatarBody[] = ["1", "2", "3"];

// Map body to legacy AvatarStyle for backward compat
export const BODY_TO_STYLE = {
  "1": "URBAN",
  "2": "AFRO",
  "3": "COSMIC",
} as const;
