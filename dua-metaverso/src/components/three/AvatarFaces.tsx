"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AvatarFace } from "@/types/user";
import { FACE_CONFIGS, type FaceConfig } from "@/lib/avatar-faces";
import { getGradientMap } from "@/lib/gradient-map";

/* ─── Slow asynchronous blink ─── */
function useBlinkScale() {
  const scaleRef = useRef(1);
  const nextBlinkRef = useRef(Math.random() * 3 + 2);
  const blinkPhaseRef = useRef(0);

  useFrame((_, delta) => {
    blinkPhaseRef.current += delta;
    if (blinkPhaseRef.current >= nextBlinkRef.current) {
      const t = blinkPhaseRef.current - nextBlinkRef.current;
      if (t < 0.12) {
        scaleRef.current = 1 - (t / 0.12) * 0.8;
      } else if (t < 0.24) {
        scaleRef.current = 0.2 + ((t - 0.12) / 0.12) * 0.8;
      } else {
        scaleRef.current = 1;
        blinkPhaseRef.current = 0;
        nextBlinkRef.current = Math.random() * 4 + 2;
      }
    }
  });

  return scaleRef;
}

/* ─── Shared skin material with warm highlights ─── */
function useSkinMaterial(color: string) {
  const gradientMap = useMemo(() => getGradientMap(), []);
  return { color, gradientMap };
}

/* ═══════════ FACE A — Afro Lusófono ═══════════ */
function FaceAfro({ cfg }: { cfg: FaceConfig }) {
  const blinkScale = useBlinkScale();
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const skin = useSkinMaterial(cfg.skin);

  useFrame(() => {
    const s = blinkScale.current;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = s;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = s;
  });

  return (
    <group>
      {/* Head sphere — generous roundness */}
      <mesh scale={cfg.headScale}>
        <sphereGeometry args={[cfg.headRadius, 24, 24]} />
        <meshToonMaterial {...skin} />
      </mesh>

      {/* Ears */}
      {[-1, 1].map((s) => (
        <mesh key={`ear-${s}`} position={[s * cfg.headRadius * 1.08, -0.005, 0]} scale={[0.6, 0.8, 0.5]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshToonMaterial {...skin} />
        </mesh>
      ))}

      {/* Full afro hair — layered for volume */}
      <mesh position={[0, 0.06, -0.01]} scale={[1.4, 1.3, 1.25]}>
        <sphereGeometry args={[cfg.headRadius * 1.18, 20, 20]} />
        <meshToonMaterial color={cfg.hairColor} gradientMap={skin.gradientMap} />
      </mesh>
      <mesh position={[0, 0.1, -0.02]} scale={[1.2, 1.1, 1.05]}>
        <sphereGeometry args={[cfg.headRadius * 1.08, 14, 14]} />
        <meshToonMaterial color={cfg.hairColor} gradientMap={skin.gradientMap} />
      </mesh>

      {/* Eyes — large expressive */}
      <group position={[0, cfg.eyeHeight, cfg.eyeDepth]}>
        {[-1, 1].map((side) => (
          <group key={`eye-${side}`}>
            {/* White */}
            <mesh ref={side === -1 ? leftEyeRef : rightEyeRef} position={[side * cfg.eyeSpacing, 0, 0]}>
              <sphereGeometry args={[cfg.eyeSize, 14, 14]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Iris */}
            <mesh position={[side * cfg.eyeSpacing, 0, cfg.eyeSize * 0.7]}>
              <sphereGeometry args={[cfg.eyeSize * 0.55, 10, 10]} />
              <meshBasicMaterial color="#1a0a00" />
            </mesh>
            {/* Specular dot */}
            <mesh position={[side * cfg.eyeSpacing + side * 0.005, 0.005, cfg.eyeSize * 0.85]}>
              <sphereGeometry args={[cfg.eyeSize * 0.18, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Eyebrows — soft arches */}
      {[-1, 1].map((side) => (
        <mesh key={`brow-${side}`} position={[side * cfg.eyeSpacing, cfg.eyeHeight + 0.022, cfg.eyeDepth + 0.008]} rotation={[0, 0, side * -0.12]}>
          <boxGeometry args={[0.03, 0.006, 0.01]} />
          <meshToonMaterial color={cfg.hairColor} gradientMap={skin.gradientMap} />
        </mesh>
      ))}

      {/* Wide nose */}
      <mesh position={[0, -0.01, cfg.eyeDepth + 0.012]}>
        <boxGeometry args={[cfg.noseWidth, cfg.noseHeight, 0.022]} />
        <meshToonMaterial {...skin} />
      </mesh>

      {/* Full lips with color */}
      <mesh position={[0, -0.04, cfg.eyeDepth - 0.003]}>
        <boxGeometry args={[cfg.lipWidth, cfg.lipThickness, 0.016]} />
        <meshBasicMaterial color="#6b2f1a" />
      </mesh>
      {/* Lower lip highlight */}
      <mesh position={[0, -0.048, cfg.eyeDepth + 0.004]}>
        <boxGeometry args={[cfg.lipWidth * 0.7, cfg.lipThickness * 0.4, 0.008]} />
        <meshBasicMaterial color="#8a3f2a" />
      </mesh>
    </group>
  );
}

/* ═══════════ FACE B — Mediterrânico ═══════════ */
function FaceMediterranean({ cfg }: { cfg: FaceConfig }) {
  const blinkScale = useBlinkScale();
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const skin = useSkinMaterial(cfg.skin);

  useFrame(() => {
    const s = blinkScale.current;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = s;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = s;
  });

  return (
    <group>
      {/* Slightly oval head */}
      <mesh scale={cfg.headScale}>
        <sphereGeometry args={[cfg.headRadius, 24, 24]} />
        <meshToonMaterial {...skin} />
      </mesh>

      {/* Ears */}
      {[-1, 1].map((s) => (
        <mesh key={`ear-${s}`} position={[s * cfg.headRadius * 1.0, -0.008, 0]} scale={[0.5, 0.7, 0.45]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshToonMaterial {...skin} />
        </mesh>
      ))}

      {/* Short structured hair with volume */}
      <mesh position={[0, 0.08, -0.01]} scale={[1.08, 0.55, 1.02]}>
        <sphereGeometry args={[cfg.headRadius * 1.08, 16, 16]} />
        <meshToonMaterial color={cfg.hairColor} gradientMap={skin.gradientMap} />
      </mesh>
      {/* Hair side fade */}
      {[-1, 1].map((side) => (
        <mesh key={`sidefade-${side}`} position={[side * 0.12, 0.03, 0]} scale={[0.35, 0.6, 0.7]}>
          <boxGeometry args={[0.06, 0.08, 0.08]} />
          <meshToonMaterial color={cfg.hairColor} gradientMap={skin.gradientMap} />
        </mesh>
      ))}

      {/* Strong angular eyebrows */}
      {[-1, 1].map((side) => (
        <mesh key={`brow-${side}`} position={[side * cfg.eyeSpacing, cfg.eyeHeight + 0.02, cfg.eyeDepth + 0.006]} rotation={[0, 0, side * -cfg.browAngle]}>
          <boxGeometry args={[0.028, 0.006, 0.01]} />
          <meshToonMaterial color={cfg.hairColor} gradientMap={skin.gradientMap} />
        </mesh>
      ))}

      {/* Almond-shaped eyes */}
      <group position={[0, cfg.eyeHeight, cfg.eyeDepth]}>
        {[-1, 1].map((side) => (
          <group key={`eye-${side}`}>
            <mesh ref={side === -1 ? leftEyeRef : rightEyeRef} position={[side * cfg.eyeSpacing, 0, 0]} scale={[1.25, 0.75, 1]}>
              <sphereGeometry args={[cfg.eyeSize, 12, 12]} />
              <meshBasicMaterial color="#f0ede6" />
            </mesh>
            <mesh position={[side * cfg.eyeSpacing, 0, cfg.eyeSize * 0.55]}>
              <sphereGeometry args={[cfg.eyeSize * 0.5, 10, 10]} />
              <meshBasicMaterial color="#3a2210" />
            </mesh>
            <mesh position={[side * cfg.eyeSpacing + side * 0.004, 0.004, cfg.eyeSize * 0.75]}>
              <sphereGeometry args={[cfg.eyeSize * 0.15, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Angular nose */}
      <mesh position={[0, -0.005, cfg.eyeDepth + 0.016]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[cfg.noseWidth, cfg.noseHeight, 0.02]} />
        <meshToonMaterial {...skin} />
      </mesh>
      {/* Nose bridge */}
      <mesh position={[0, 0.01, cfg.eyeDepth + 0.01]}>
        <boxGeometry args={[cfg.noseWidth * 0.5, 0.02, 0.01]} />
        <meshToonMaterial {...skin} />
      </mesh>

      {/* Thinner natural lips */}
      <mesh position={[0, -0.035, cfg.eyeDepth - 0.004]}>
        <boxGeometry args={[cfg.lipWidth, cfg.lipThickness, 0.013]} />
        <meshBasicMaterial color="#a07060" />
      </mesh>
    </group>
  );
}

/* ═══════════ FACE C — Asiático-Lusófono ═══════════ */
function FaceAsian({ cfg }: { cfg: FaceConfig }) {
  const blinkScale = useBlinkScale();
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const skin = useSkinMaterial(cfg.skin);

  useFrame(() => {
    const s = blinkScale.current;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = s;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = s;
  });

  return (
    <group>
      {/* Slightly narrower, taller head */}
      <mesh scale={cfg.headScale}>
        <sphereGeometry args={[cfg.headRadius, 24, 24]} />
        <meshToonMaterial {...skin} />
      </mesh>

      {/* Ears */}
      {[-1, 1].map((s) => (
        <mesh key={`ear-${s}`} position={[s * cfg.headRadius * 0.98, -0.005, 0]} scale={[0.5, 0.65, 0.4]}>
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshToonMaterial {...skin} />
        </mesh>
      ))}

      {/* Straight hair with volume on top */}
      <mesh position={[0, 0.09, 0]} scale={[0.98, 0.68, 0.92]}>
        <sphereGeometry args={[cfg.headRadius * 1.12, 16, 16]} />
        <meshToonMaterial color={cfg.hairColor} gradientMap={skin.gradientMap} />
      </mesh>
      {/* Side hair panels */}
      {[-1, 1].map((side) => (
        <mesh key={`hair-${side}`} position={[side * 0.1, 0.03, -0.02]} scale={[0.32, 0.72, 0.82]}>
          <boxGeometry args={[0.08, 0.12, 0.1]} />
          <meshToonMaterial color={cfg.hairColor} gradientMap={skin.gradientMap} />
        </mesh>
      ))}
      {/* Fringe / bangs */}
      <mesh position={[0, 0.1, 0.1]} scale={[1.05, 0.3, 0.4]}>
        <sphereGeometry args={[cfg.headRadius * 0.9, 10, 10]} />
        <meshToonMaterial color={cfg.hairColor} gradientMap={skin.gradientMap} />
      </mesh>

      {/* Characteristic narrow eyes */}
      <group position={[0, cfg.eyeHeight, cfg.eyeDepth]}>
        {[-1, 1].map((side) => (
          <group key={`eye-${side}`}>
            <mesh ref={side === -1 ? leftEyeRef : rightEyeRef} position={[side * cfg.eyeSpacing, 0, 0]} scale={[1.45, 0.5, 1]}>
              <sphereGeometry args={[cfg.eyeSize, 12, 12]} />
              <meshBasicMaterial color="#f5f0e6" />
            </mesh>
            <mesh position={[side * cfg.eyeSpacing, 0, cfg.eyeSize * 0.5]}>
              <sphereGeometry args={[cfg.eyeSize * 0.55, 10, 10]} />
              <meshBasicMaterial color="#1a1008" />
            </mesh>
            <mesh position={[side * cfg.eyeSpacing + side * 0.003, 0.003, cfg.eyeSize * 0.7]}>
              <sphereGeometry args={[cfg.eyeSize * 0.15, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Eyelid fold crease */}
            <mesh position={[side * cfg.eyeSpacing, cfg.eyeSize * 0.45, 0.002]} scale={[1.5, 0.1, 1]}>
              <sphereGeometry args={[cfg.eyeSize * 0.6, 8, 4]} />
              <meshToonMaterial {...skin} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Small delicate nose */}
      <mesh position={[0, -0.005, cfg.eyeDepth + 0.011]}>
        <boxGeometry args={[cfg.noseWidth, cfg.noseHeight, 0.016]} />
        <meshToonMaterial {...skin} />
      </mesh>

      {/* Subtle lips */}
      <mesh position={[0, -0.035, cfg.eyeDepth - 0.004]}>
        <boxGeometry args={[cfg.lipWidth, cfg.lipThickness, 0.011]} />
        <meshBasicMaterial color="#c49080" />
      </mesh>
    </group>
  );
}

/* ─── Exported Face Component ─── */
export function AvatarFaceComponent({ face }: { face: AvatarFace }) {
  const cfg = FACE_CONFIGS[face];
  switch (face) {
    case "A": return <FaceAfro cfg={cfg} />;
    case "B": return <FaceMediterranean cfg={cfg} />;
    case "C": return <FaceAsian cfg={cfg} />;
  }
}
