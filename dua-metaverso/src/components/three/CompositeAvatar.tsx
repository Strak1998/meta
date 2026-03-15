"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import type { AvatarFace, AvatarBody } from "@/types/user";
import { AvatarFaceComponent } from "./AvatarFaces";
import { AvatarBodyComponent } from "./AvatarBodies";
import { BODY_CONFIGS } from "@/lib/avatar-bodies";

/* Neck attachment Y-offsets per body type to keep proportions correct */
const HEAD_Y_OFFSET: Record<AvatarBody, number> = {
  "1": 0.44,
  "2": 0.48,
  "3": 0.46,
};

interface CompositeAvatarProps {
  face: AvatarFace;
  body: AvatarBody;
  /** Enable gentle idle bob animation */
  idle?: boolean;
  /** Scale factor for preview canvases vs scene */
  scale?: number;
}

export function CompositeAvatar({ face, body, idle = true, scale = 1 }: CompositeAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headY = HEAD_Y_OFFSET[body];

  useFrame((state) => {
    if (!idle || !groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 3.5) * 0.02;
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Body at origin */}
      <group position={[0, 0, 0]}>
        <AvatarBodyComponent body={body} />
      </group>
      {/* Face mounted on neck */}
      <group position={[0, headY, 0]}>
        <AvatarFaceComponent face={face} />
      </group>
    </group>
  );
}

export function getBodyAccent(body: AvatarBody): string {
  return BODY_CONFIGS[body].accent;
}
