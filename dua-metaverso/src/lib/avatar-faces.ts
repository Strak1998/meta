import type { AvatarFace } from "@/types/user";

export interface FaceConfig {
  id: AvatarFace;
  label: string;
  skin: string;
  headScale: [number, number, number];
  headRadius: number;
  eyeSize: number;
  eyeSpacing: number;
  eyeHeight: number;
  eyeDepth: number;
  eyeShape: "round" | "almond" | "narrow";
  noseWidth: number;
  noseHeight: number;
  lipWidth: number;
  lipThickness: number;
  hairType: "afro" | "short" | "straight";
  hairColor: string;
  browAngle: number;
}

export const FACE_CONFIGS: Record<AvatarFace, FaceConfig> = {
  A: {
    id: "A",
    label: "Afro Lusófono",
    skin: "#3b1f0b",
    headScale: [1.1, 1.0, 1.05],
    headRadius: 0.17,
    eyeSize: 0.028,
    eyeSpacing: 0.055,
    eyeHeight: 0.02,
    eyeDepth: 0.155,
    eyeShape: "round",
    noseWidth: 0.04,
    noseHeight: 0.015,
    lipWidth: 0.05,
    lipThickness: 0.018,
    hairType: "afro",
    hairColor: "#1a0a00",
    browAngle: 0,
  },
  B: {
    id: "B",
    label: "Mediterrânico",
    skin: "#b08860",
    headScale: [0.95, 1.08, 1.0],
    headRadius: 0.16,
    eyeSize: 0.022,
    eyeSpacing: 0.048,
    eyeHeight: 0.025,
    eyeDepth: 0.145,
    eyeShape: "almond",
    noseWidth: 0.028,
    noseHeight: 0.025,
    lipWidth: 0.035,
    lipThickness: 0.012,
    hairType: "short",
    hairColor: "#2a1a0a",
    browAngle: 0.15,
  },
  C: {
    id: "C",
    label: "Asiático-Lusófono",
    skin: "#e8c999",
    headScale: [0.9, 1.12, 0.95],
    headRadius: 0.155,
    eyeSize: 0.018,
    eyeSpacing: 0.05,
    eyeHeight: 0.03,
    eyeDepth: 0.14,
    eyeShape: "narrow",
    noseWidth: 0.025,
    noseHeight: 0.018,
    lipWidth: 0.032,
    lipThickness: 0.01,
    hairType: "straight",
    hairColor: "#0a0a12",
    browAngle: 0.05,
  },
};

export const FACE_IDS: AvatarFace[] = ["A", "B", "C"];
