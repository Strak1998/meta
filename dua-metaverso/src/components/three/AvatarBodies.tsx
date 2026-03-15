"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AvatarBody } from "@/types/user";
import { BODY_CONFIGS, type BodyConfig } from "@/lib/avatar-bodies";
import { getGradientMap } from "@/lib/gradient-map";

/* ═══════════ BODY 1 — Urban Streetwear ═══════════ */
function BodyUrban({ cfg }: { cfg: BodyConfig }) {
  const gradientMap = useMemo(() => getGradientMap(), []);

  return (
    <group>
      {/* Hoodie torso */}
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[cfg.torsoWidth, cfg.torsoHeight, 10, 20]} />
        <meshToonMaterial color={cfg.clothing} gradientMap={gradientMap} />
      </mesh>
      {/* Vest overlay — layered depth */}
      <mesh position={[0, 0.02, 0.012]}>
        <capsuleGeometry args={[cfg.torsoWidth + 0.018, cfg.torsoHeight * 0.68, 8, 16]} />
        <meshToonMaterial color={cfg.clothingSecondary} gradientMap={gradientMap} transparent opacity={0.85} />
      </mesh>
      {/* Hood at back */}
      <mesh position={[0, cfg.torsoHeight * 0.5 + 0.02, -0.06]}>
        <sphereGeometry args={[0.065, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshToonMaterial color={cfg.clothing} gradientMap={gradientMap} />
      </mesh>
      {/* Hood drawstrings */}
      {[-1, 1].map((side) => (
        <mesh key={`string-${side}`} position={[side * 0.04, cfg.torsoHeight * 0.35, cfg.torsoWidth + 0.01]}>
          <cylinderGeometry args={[0.003, 0.003, 0.08, 4]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.6} />
        </mesh>
      ))}
      {/* Accent shoulder pads */}
      {[-1, 1].map((side) => (
        <mesh key={`shoulder-${side}`} position={[side * cfg.shoulderWidth, cfg.torsoHeight * 0.35, 0]}>
          <boxGeometry args={[0.065, 0.035, 0.11]} />
          <meshBasicMaterial color={cfg.accent} transparent opacity={0.5} />
        </mesh>
      ))}
      {/* Arms with sleeve detail */}
      {[-1, 1].map((side) => (
        <group key={`arm-${side}`}>
          <mesh position={[side * (cfg.shoulderWidth + 0.02), 0.06, 0.04]} rotation={[0.2, 0, side * 0.45]}>
            <capsuleGeometry args={[0.042, cfg.armLength, 6, 10]} />
            <meshToonMaterial color={cfg.clothing} gradientMap={gradientMap} />
          </mesh>
          {/* Wristband */}
          <mesh position={[side * (cfg.shoulderWidth + 0.06), -0.1, 0.08]}>
            <torusGeometry args={[0.035, 0.008, 6, 12]} />
            <meshBasicMaterial color={cfg.accent} transparent opacity={0.7} />
          </mesh>
          {/* Hands */}
          <mesh position={[side * (cfg.shoulderWidth + 0.06), -0.14, 0.09]}>
            <sphereGeometry args={[0.028, 8, 8]} />
            <meshToonMaterial color="#3b1f0b" gradientMap={gradientMap} />
          </mesh>
        </group>
      ))}
      {/* Cargo pants */}
      {[-1, 1].map((side) => (
        <group key={`leg-${side}`}>
          <mesh position={[side * 0.07, -cfg.torsoHeight * 0.5 - cfg.legLength * 0.5, 0]}>
            <capsuleGeometry args={[0.052, cfg.legLength, 6, 10]} />
            <meshToonMaterial color="#2a3a2e" gradientMap={gradientMap} />
          </mesh>
          {/* Cargo pocket */}
          <mesh position={[side * 0.1, -cfg.torsoHeight * 0.5 - cfg.legLength * 0.35, side * 0.02]}>
            <boxGeometry args={[0.032, 0.045, 0.042]} />
            <meshToonMaterial color="#3a4a3e" gradientMap={gradientMap} />
          </mesh>
          {/* Knee highlight */}
          <mesh position={[side * 0.07, -cfg.torsoHeight * 0.5 - cfg.legLength * 0.2, 0.035]}>
            <boxGeometry args={[0.04, 0.02, 0.015]} />
            <meshToonMaterial color="#354540" gradientMap={gradientMap} />
          </mesh>
        </group>
      ))}
      {/* Chunky sneakers with sole detail */}
      {[-1, 1].map((side) => (
        <group key={`shoe-${side}`}>
          <mesh position={[side * 0.07, -cfg.torsoHeight * 0.5 - cfg.legLength - 0.01, 0.02]}>
            <boxGeometry args={[0.065, cfg.shoeHeight, 0.11]} />
            <meshToonMaterial color="#ffffff" gradientMap={gradientMap} />
          </mesh>
          {/* Sole accent */}
          <mesh position={[side * 0.07, -cfg.torsoHeight * 0.5 - cfg.legLength - cfg.shoeHeight * 0.4, 0.02]}>
            <boxGeometry args={[0.068, 0.015, 0.115]} />
            <meshBasicMaterial color={cfg.accent} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
      {/* Center hoodie stripe */}
      <mesh position={[0, 0.05, cfg.torsoWidth + 0.006]}>
        <boxGeometry args={[0.022, cfg.torsoHeight * 0.65, 0.003]} />
        <meshBasicMaterial color={cfg.accent} transparent opacity={0.6} />
      </mesh>
      {/* Belt */}
      <mesh position={[0, -cfg.torsoHeight * 0.42, 0]}>
        <torusGeometry args={[cfg.torsoWidth + 0.01, 0.01, 6, 16]} />
        <meshToonMaterial color="#1a1a1a" gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}

/* ═══════════ BODY 2 — Afro Cultural ═══════════ */
function BodyAfro({ cfg }: { cfg: BodyConfig }) {
  const gradientMap = useMemo(() => getGradientMap(), []);
  const patternRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (patternRef.current) {
      const mat = patternRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group>
      {/* Dashiki torso — wider proportions */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <capsuleGeometry args={[cfg.torsoWidth, cfg.torsoHeight, 10, 20]} />
        <meshToonMaterial color={cfg.clothing} gradientMap={gradientMap} />
      </mesh>
      {/* Dashiki flare at bottom */}
      <mesh position={[0, -cfg.torsoHeight * 0.35, 0]}>
        <cylinderGeometry args={[cfg.torsoWidth, cfg.torsoWidth * 1.45, 0.13, 14]} />
        <meshToonMaterial color={cfg.clothing} gradientMap={gradientMap} />
      </mesh>
      {/* Geometric emissive chest pattern */}
      <mesh ref={patternRef} position={[0, 0.06, cfg.torsoWidth + 0.006]}>
        <planeGeometry args={[cfg.torsoWidth * 1.3, cfg.torsoHeight * 0.42]} />
        <meshBasicMaterial color={cfg.accent} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Diamond pattern accents on torso */}
      {[-0.05, 0, 0.05].map((y) => (
        <mesh key={`diamond-${y}`} position={[0, y, cfg.torsoWidth + 0.007]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.025, 0.025]} />
          <meshBasicMaterial color={cfg.accent} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Neckline accent collar */}
      <mesh position={[0, cfg.torsoHeight * 0.45, 0.02]}>
        <torusGeometry args={[0.065, 0.014, 10, 16, Math.PI]} />
        <meshBasicMaterial color={cfg.accent} />
      </mesh>
      {/* Necklace / beads */}
      <mesh position={[0, cfg.torsoHeight * 0.38, 0.04]}>
        <torusGeometry args={[0.08, 0.006, 6, 20]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
      {/* Arms — wider, with cultural bracelets */}
      {[-1, 1].map((side) => (
        <group key={`arm-${side}`}>
          <mesh position={[side * (cfg.shoulderWidth + 0.02), 0.04, 0.04]} rotation={[0.15, 0, side * 0.5]}>
            <capsuleGeometry args={[0.052, cfg.armLength, 6, 10]} />
            <meshToonMaterial color={cfg.clothing} gradientMap={gradientMap} />
          </mesh>
          {/* Forearm bangle */}
          <mesh position={[side * (cfg.shoulderWidth + 0.06), -0.06, 0.07]}>
            <torusGeometry args={[0.04, 0.006, 6, 12]} />
            <meshBasicMaterial color="#ffd700" />
          </mesh>
          {/* Hands */}
          <mesh position={[side * (cfg.shoulderWidth + 0.06), -0.14, 0.08]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshToonMaterial color="#3b1f0b" gradientMap={gradientMap} />
          </mesh>
        </group>
      ))}
      {/* Wide flowing pants */}
      {[-1, 1].map((side) => (
        <mesh key={`leg-${side}`} position={[side * 0.08, -cfg.torsoHeight * 0.5 - cfg.legLength * 0.5, 0]}>
          <capsuleGeometry args={[0.058, cfg.legLength, 6, 10]} />
          <meshToonMaterial color="#3a2210" gradientMap={gradientMap} />
        </mesh>
      ))}
      {/* Barefoot with anklet */}
      {[-1, 1].map((side) => (
        <group key={`foot-${side}`}>
          <mesh position={[side * 0.08, -cfg.torsoHeight * 0.5 - cfg.legLength - 0.02, 0.015]}>
            <cylinderGeometry args={[0.032, 0.038, 0.032, 10]} />
            <meshToonMaterial color="#5a3a20" gradientMap={gradientMap} />
          </mesh>
          {/* Anklet */}
          <mesh position={[side * 0.08, -cfg.torsoHeight * 0.5 - cfg.legLength + 0.02, 0]}>
            <torusGeometry args={[0.045, 0.004, 4, 12]} />
            <meshBasicMaterial color={cfg.accent} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ═══════════ BODY 3 — Cosmic Futurista ═══════════ */
function BodyCosmic({ cfg }: { cfg: BodyConfig }) {
  const gradientMap = useMemo(() => getGradientMap(), []);
  const linesRef = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    linesRef.current.forEach((mesh, i) => {
      if (mesh) {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.35 + Math.sin(t * 3 + i * 1.5) * 0.3;
      }
    });
  });

  return (
    <group>
      {/* Slim spacesuit torso */}
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[cfg.torsoWidth, cfg.torsoHeight, 10, 20]} />
        <meshToonMaterial color={cfg.clothing} gradientMap={gradientMap} />
      </mesh>
      {/* Suit panel lines on torso */}
      {[-0.08, -0.02, 0.04, 0.1].map((y, i) => (
        <mesh
          key={`line-${i}`}
          ref={(el) => { if (el) linesRef.current[i] = el; }}
          position={[0, y, cfg.torsoWidth + 0.006]}
        >
          <planeGeometry args={[cfg.torsoWidth * 1.7, 0.007]} />
          <meshBasicMaterial color={cfg.accent} transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Chest emblem */}
      <mesh position={[0, 0.08, cfg.torsoWidth + 0.007]}>
        <ringGeometry args={[0.02, 0.03, 6]} />
        <meshBasicMaterial color={cfg.accent} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* Shoulder pads with glow */}
      {[-1, 1].map((side) => (
        <group key={`pad-${side}`}>
          <mesh position={[side * cfg.shoulderWidth, cfg.torsoHeight * 0.35, 0]}>
            <boxGeometry args={[0.055, 0.028, 0.09]} />
            <meshBasicMaterial color={cfg.accent} />
          </mesh>
          {/* Pad detail stripe */}
          <mesh position={[side * cfg.shoulderWidth, cfg.torsoHeight * 0.35, 0.05]}>
            <boxGeometry args={[0.04, 0.006, 0.005]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
      {/* Arms — slim with suit detail */}
      {[-1, 1].map((side) => (
        <group key={`arm-${side}`}>
          <mesh position={[side * (cfg.shoulderWidth + 0.01), 0.04, 0.04]} rotation={[0.2, 0, side * 0.4]}>
            <capsuleGeometry args={[0.037, cfg.armLength, 6, 10]} />
            <meshToonMaterial color={cfg.clothing} gradientMap={gradientMap} />
          </mesh>
          {/* Arm accent band */}
          <mesh position={[side * (cfg.shoulderWidth + 0.04), -0.02, 0.06]}>
            <torusGeometry args={[0.032, 0.005, 4, 10]} />
            <meshBasicMaterial color={cfg.accent} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
      {/* Gloves — spheres at hands */}
      {[-1, 1].map((side) => (
        <mesh key={`glove-${side}`} position={[side * (cfg.shoulderWidth + 0.06), -0.12, 0.08]}>
          <sphereGeometry args={[0.032, 10, 10]} />
          <meshBasicMaterial color={cfg.accent} />
        </mesh>
      ))}
      {/* Utility belt */}
      <mesh position={[0, -cfg.torsoHeight * 0.38, 0]}>
        <torusGeometry args={[cfg.torsoWidth + 0.008, 0.012, 6, 20]} />
        <meshToonMaterial color="#1a1a3e" gradientMap={gradientMap} />
      </mesh>
      {/* Belt pouches */}
      {[-1, 1].map((side) => (
        <mesh key={`pouch-${side}`} position={[side * 0.12, -cfg.torsoHeight * 0.38, 0.02]}>
          <boxGeometry args={[0.03, 0.025, 0.02]} />
          <meshToonMaterial color="#0d0d22" gradientMap={gradientMap} />
        </mesh>
      ))}
      {/* Legs — slim */}
      {[-1, 1].map((side) => (
        <mesh key={`leg-${side}`} position={[side * 0.065, -cfg.torsoHeight * 0.5 - cfg.legLength * 0.5, 0]}>
          <capsuleGeometry args={[0.042, cfg.legLength, 6, 10]} />
          <meshToonMaterial color={cfg.clothingSecondary} gradientMap={gradientMap} />
        </mesh>
      ))}
      {/* Tall boots */}
      {[-1, 1].map((side) => (
        <group key={`boot-${side}`}>
          <mesh position={[side * 0.065, -cfg.torsoHeight * 0.5 - cfg.legLength + 0.01, 0]}>
            <cylinderGeometry args={[0.048, 0.053, cfg.shoeHeight, 10]} />
            <meshToonMaterial color="#2a2a4a" gradientMap={gradientMap} />
          </mesh>
          {/* Boot accent ring */}
          <mesh position={[side * 0.065, -cfg.torsoHeight * 0.5 - cfg.legLength + cfg.shoeHeight * 0.3, 0]}>
            <torusGeometry args={[0.05, 0.004, 4, 12]} />
            <meshBasicMaterial color={cfg.accent} transparent opacity={0.5} />
          </mesh>
          {/* Boot sole */}
          <mesh position={[side * 0.065, -cfg.torsoHeight * 0.5 - cfg.legLength - cfg.shoeHeight * 0.5 + 0.01, 0.012]}>
            <boxGeometry args={[0.058, 0.016, 0.085]} />
            <meshBasicMaterial color={cfg.accent} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── Exported Body Component ─── */
export function AvatarBodyComponent({ body }: { body: AvatarBody }) {
  const cfg = BODY_CONFIGS[body];
  switch (body) {
    case "1": return <BodyUrban cfg={cfg} />;
    case "2": return <BodyAfro cfg={cfg} />;
    case "3": return <BodyCosmic cfg={cfg} />;
  }
}
