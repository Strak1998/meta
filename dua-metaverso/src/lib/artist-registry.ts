import type { ArtistSlot } from "@/types/artist";

export function defaultArtistSlots(): ArtistSlot[] {
  return [
    { id: "vado-mka", name: "VADO MKA", accentColor: "#ff6b35", defaultPosition: "esquerda", skinColor: "#8B4513", clothingColor: "#ff6b35", entryAnimationDuration: 2500, status: "aguarda", bio: "Trap & Afro-Fusion" },
    { id: "uzzy", name: "UZZY", accentColor: "#9b59b6", defaultPosition: "centro", skinColor: "#6B3A2A", clothingColor: "#9b59b6", entryAnimationDuration: 3000, status: "aguarda", bio: "Kizomba & R&B" },
    { id: "estraca", name: "ESTRACA", accentColor: "#00d4ff", defaultPosition: "direita", skinColor: "#4A2010", clothingColor: "#00d4ff", entryAnimationDuration: 2000, status: "aguarda", bio: "Funana & Electro" },
    { id: "slot-4", name: "", accentColor: "#27ae60", defaultPosition: "esquerda", skinColor: "#5C3317", clothingColor: "#27ae60", entryAnimationDuration: 2000, status: "aguarda" },
    { id: "slot-5", name: "", accentColor: "#e74c3c", defaultPosition: "centro", skinColor: "#8B6914", clothingColor: "#e74c3c", entryAnimationDuration: 2000, status: "aguarda" },
    { id: "slot-6", name: "", accentColor: "#f39c12", defaultPosition: "direita", skinColor: "#3D1F00", clothingColor: "#f39c12", entryAnimationDuration: 2000, status: "aguarda" },
    { id: "slot-7", name: "", accentColor: "#1abc9c", defaultPosition: "esquerda", skinColor: "#5C3317", clothingColor: "#1abc9c", entryAnimationDuration: 2000, status: "aguarda" },
    { id: "slot-8", name: "", accentColor: "#e91e63", defaultPosition: "centro", skinColor: "#4A2010", clothingColor: "#e91e63", entryAnimationDuration: 2000, status: "aguarda" },
    { id: "slot-9", name: "", accentColor: "#3f51b5", defaultPosition: "direita", skinColor: "#8B4513", clothingColor: "#3f51b5", entryAnimationDuration: 2000, status: "aguarda" },
    { id: "slot-10", name: "", accentColor: "#ff5722", defaultPosition: "esquerda", skinColor: "#6B3A2A", clothingColor: "#ff5722", entryAnimationDuration: 2000, status: "aguarda" },
    { id: "slot-11", name: "", accentColor: "#607d8b", defaultPosition: "centro", skinColor: "#8B6914", clothingColor: "#607d8b", entryAnimationDuration: 2000, status: "aguarda" },
    { id: "slot-12", name: "", accentColor: "#795548", defaultPosition: "direita", skinColor: "#3D1F00", clothingColor: "#795548", entryAnimationDuration: 2000, status: "aguarda" },
  ];
}
