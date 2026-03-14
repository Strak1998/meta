"use client";

import { Suspense, useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Stars,
  OrbitControls,
  Float,
  Text,
  Billboard,
  Sparkles,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  DepthOfField,
  N8AO,
  ToneMapping,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

type ConcertPhase =
  | "opening"
  | "dua2_presentation"
  | "vado_performance"
  | "uzzy_performance"
  | "estraca_performance"
  | "finale";

/* ═══════════════════════════════════════════════════════
   POST-PROCESSING — Cinematic AAA pipeline
   Waits for WebGL context before mounting EffectComposer
   ═══════════════════════════════════════════════════════ */

function PostProcessing() {
  const { gl } = useThree();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (gl) setReady(true);
  }, [gl]);

  if (!ready) return null;

  return (
    <EffectComposer enableNormalPass>
      <N8AO
        aoRadius={0.8}
        intensity={2}
        aoSamples={16}
        denoiseSamples={4}
        denoiseRadius={12}
        distanceFalloff={1.5}
        halfRes
      />
      <Bloom
        luminanceThreshold={0.3}
        mipmapBlur
        intensity={2.5}
        radius={0.85}
      />
      <DepthOfField
        focusDistance={0.012}
        focalLength={0.06}
        bokehScale={3}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.0006, 0.0006)}
      />
      <Vignette eskil={false} offset={0.05} darkness={1.4} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

/* ═══════════════════════════════════════════════════════
   MOON — massive cinematic sphere with atmosphere
   ═══════════════════════════════════════════════════════ */

function MassiveMoon() {
  const moonRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (moonRef.current) moonRef.current.rotation.y = t * 0.006;
    if (ringsRef.current) ringsRef.current.rotation.z = t * 0.015;
    if (haloRef.current) {
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.035 + Math.sin(t * 0.5) * 0.015;
    }
  });

  return (
    <group>
      <mesh ref={moonRef} position={[0, 22, -70]}>
        <sphereGeometry args={[35, 128, 128]} />
        <meshStandardMaterial
          color="#b8b8c8"
          roughness={0.95}
          metalness={0.05}
          emissive="#0a0a1a"
          emissiveIntensity={0.15}
        />
      </mesh>
      <mesh ref={haloRef} position={[0, 22, -71]}>
        <sphereGeometry args={[37, 64, 64]} />
        <meshBasicMaterial color="#4488cc" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, 22, -72]}>
        <sphereGeometry args={[40, 32, 32]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.012} side={THREE.BackSide} />
      </mesh>
      <group ref={ringsRef} position={[0, 22, -70]}>
        {[
          { radius: 40, thickness: 0.04, color: "#00ffcc", opacity: 0.1, rotX: Math.PI / 2.2, rotY: 0.2 },
          { radius: 42, thickness: 0.025, color: "#ff00ff", opacity: 0.05, rotX: Math.PI / 2.5, rotY: -0.3 },
          { radius: 44, thickness: 0.015, color: "#ffd700", opacity: 0.03, rotX: Math.PI / 3, rotY: 0.5 },
        ].map((ring, i) => (
          <mesh key={i} rotation={[ring.rotX, ring.rotY, i * 0.2]}>
            <torusGeometry args={[ring.radius, ring.thickness, 8, 256]} />
            <meshBasicMaterial color={ring.color} transparent opacity={ring.opacity} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   HOLOGRAPHIC STAGE — cinematic reflective floor
   ═══════════════════════════════════════════════════════ */

function HolographicStage() {
  const pulseRef = useRef<THREE.Mesh>(null);
  const scanRef = useRef<THREE.Mesh>(null);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (pulseRef.current) {
      const scale = 1 + Math.sin(t * 2) * 0.025;
      pulseRef.current.scale.set(scale, scale, 1);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.45 + Math.sin(t * 3) * 0.2;
    }
    if (scanRef.current) {
      const scan = ((t * 0.3) % 1) * 32 - 16;
      scanRef.current.position.z = scan;
      (scanRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.06 * (1 - Math.abs(scan) / 16);
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[18, 128]} />
        <meshStandardMaterial color="#040408" roughness={0.03} metalness={0.98} envMapIntensity={0.5} />
      </mesh>
      {Array.from({ length: 16 }).map((_, i) => (
        <group key={`grid-${i}`}>
          <mesh position={[0, 0.004, -10 + i * 1.3]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[36, 0.006]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.035} />
          </mesh>
          <mesh position={[-10 + i * 1.3, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.006, 36]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.035} />
          </mesh>
        </group>
      ))}
      <mesh ref={scanRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <planeGeometry args={[36, 0.15]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[17.4, 18, 128]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[5.2, 5.5, 64]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.25} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={`hex-${i}`} rotation={[-Math.PI / 2, 0, a]} position={[Math.sin(a) * 14, 0.008, Math.cos(a) * 14]}>
            <ringGeometry args={[0.25, 0.35, 6]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.15} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   DJ BOOTH — console, turntables, mixer, EQ
   ═══════════════════════════════════════════════════════ */

function DJBooth() {
  return (
    <group position={[0, 0, -3]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[3.6, 0.14, 1.3]} />
        <meshStandardMaterial color="#050510" roughness={0.06} metalness={0.96} />
      </mesh>
      <mesh position={[0, 0.35, 0.66]}>
        <boxGeometry args={[3.4, 0.64, 0.012]} />
        <meshStandardMaterial color="#00ffcc" transparent opacity={0.08} emissive="#00ffcc" emissiveIntensity={0.1} />
      </mesh>
      <Billboard position={[0, 0.35, 0.68]}>
        <Text fontSize={0.24} color="#00ffcc" anchorX="center" anchorY="middle" material-toneMapped={false}>
          {"\u2605 DUA LUA \u2605"}
        </Text>
      </Billboard>
      {[
        { pos: [0, 0.68, 0.66] as [number, number, number], size: [3.6, 0.01, 0.01] as [number, number, number], col: "#00ffcc" },
        { pos: [0, 0.04, 0.66] as [number, number, number], size: [3.6, 0.01, 0.01] as [number, number, number], col: "#ff00ff" },
        { pos: [-1.8, 0.36, 0.66] as [number, number, number], size: [0.01, 0.66, 0.01] as [number, number, number], col: "#00ffcc" },
        { pos: [1.8, 0.36, 0.66] as [number, number, number], size: [0.01, 0.66, 0.01] as [number, number, number], col: "#00ffcc" },
      ].map((edge, i) => (
        <mesh key={i} position={edge.pos}>
          <boxGeometry args={edge.size} />
          <meshBasicMaterial color={edge.col} />
        </mesh>
      ))}
      <Turntable position={[-0.9, 0.68, 0]} />
      <Turntable position={[0.9, 0.68, 0]} />
      <mesh position={[0, 0.71, 0]}>
        <boxGeometry args={[0.7, 0.04, 0.55]} />
        <meshStandardMaterial color="#181830" roughness={0.12} metalness={0.85} />
      </mesh>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`knob-${i}`} position={[-0.15 + i * 0.1, 0.75, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.02, 12]} />
          <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={0.3} metalness={0.9} />
        </mesh>
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <EQBar key={i} index={i} position={[-0.38 + i * 0.04, 0.74, -0.15]} />
      ))}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[3.5, 4, 0.12, 64]} />
        <meshStandardMaterial color="#040510" roughness={0.15} metalness={0.85} />
      </mesh>
    </group>
  );
}

function Turntable({ position }: { position: [number, number, number] }) {
  const discRef = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => { if (discRef.current) discRef.current.rotation.y += dt * 3.5; });
  return (
    <group position={position}>
      <mesh ref={discRef} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.012, 32]} />
        <meshStandardMaterial color="#080808" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.06, 16]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0.24, 0.025, -0.14]} rotation={[0, 0.3, -0.1]}>
        <cylinderGeometry args={[0.004, 0.004, 0.22, 8]} />
        <meshStandardMaterial color="#999" metalness={0.95} />
      </mesh>
    </group>
  );
}

function EQBar({ index, position }: { index: number; position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      const t = s.clock.elapsedTime;
      ref.current.scale.y = 0.3 + Math.max(0, Math.sin(t * 16 + index * 0.65)) * 2.8 *
        Math.abs(Math.cos(t * 3.5 + index * 0.3));
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.02, 0.03, 0.02]} />
      <meshBasicMaterial color={index < 10 ? "#00ffcc" : index < 15 ? "#ffaa00" : "#ff2244"} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════
   DJ STAR AVATAR — Black woman, box braids, cinematic
   ═══════════════════════════════════════════════════════ */

/*
  GLB MODEL INTEGRATION:
  To replace this procedural avatar with a GLB model:

  import { useGLTF } from "@react-three/drei";

  function DJStarAvatar() {
    const { scene } = useGLTF("/models/dj-dua-avatar.glb");
    return <primitive object={scene} position={[0, 0, -2.5]} scale={1.2} />;
  }

  // Preload: useGLTF.preload("/models/dj-dua-avatar.glb");
  // Place the .glb file in /public/models/
*/

function DJStarAvatar() {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const braidsRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y =
        Math.sin(t * 4.2) * 0.05 +
        Math.sin(t * 2.1) * 0.035 +
        Math.abs(Math.sin(t * 8.4)) * 0.015;
    }
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 4) * 0.12 + Math.abs(Math.sin(t * 8)) * 0.04;
      headRef.current.rotation.z = Math.sin(t * 2) * 0.06;
      headRef.current.rotation.y = Math.sin(t * 1.5) * 0.08;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 8) * 0.35 - 0.7;
      leftArmRef.current.rotation.z = Math.cos(t * 4) * 0.12;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.cos(t * 3) * 0.3 - 0.6;
      rightArmRef.current.rotation.z = Math.sin(t * 2.5) * 0.08;
    }
    if (braidsRef.current) {
      braidsRef.current.rotation.y = Math.sin(t * 1.8) * 0.16;
      braidsRef.current.rotation.x = Math.abs(Math.sin(t * 4)) * 0.08;
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.12 + Math.sin(t * 3) * 0.08 + Math.abs(Math.sin(t * 8)) * 0.05;
      glowRef.current.rotation.z = t * 0.25;
    }
  });

  const braids = useMemo(() => {
    return Array.from({ length: 36 }).map((_, i) => {
      const angle = (i / 36) * Math.PI * 2;
      if (Math.cos(angle) > 0.5) return null;
      const len = 0.25 + (((i * 7 + 13) % 17) / 17) * 0.32;
      const hasBead = i % 3 === 0;
      const isCyan = i % 5 === 0;
      const hasRing = i % 7 === 0;
      const swayOffset = ((i * 11 + 5) % 13) / 13;
      return { angle, len, hasBead, isCyan, hasRing, swayOffset, i };
    }).filter(Boolean);
  }, []);

  return (
    <Float speed={0.3} rotationIntensity={0} floatIntensity={0.2}>
      <group ref={groupRef} position={[0, -0.05, -2.5]}>
        {/* Torso with glowing jacket */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <capsuleGeometry args={[0.26, 0.54, 16, 32]} />
          <meshStandardMaterial color="#080818" roughness={0.2} metalness={0.88} />
        </mesh>
        <mesh position={[0, 1.15, 0.22]}>
          <capsuleGeometry args={[0.24, 0.5, 8, 16]} />
          <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.14} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={`shoulder-${side}`} position={[side * 0.28, 1.4, 0]}>
            <boxGeometry args={[0.1, 0.04, 0.17]} />
            <meshBasicMaterial color="#ff00ff" transparent opacity={0.5} />
          </mesh>
        ))}

        {/* Neck */}
        <mesh position={[0, 1.54, 0]}>
          <cylinderGeometry args={[0.06, 0.085, 0.14]} />
          <meshStandardMaterial color="#2d1610" roughness={0.5} />
        </mesh>

        {/* Head */}
        <group ref={headRef} position={[0, 1.72, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.21, 32, 32]} />
            <meshStandardMaterial color="#2d1610" roughness={0.45} metalness={0.05} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={`eye-${side}`}>
              <mesh position={[side * 0.068, 0.02, 0.18]}>
                <sphereGeometry args={[0.028, 16, 16]} />
                <meshStandardMaterial color="#1a0a05" roughness={0.25} />
              </mesh>
              <mesh position={[side * 0.063, 0.027, 0.2]}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.07, 0.17]}>
            <sphereGeometry args={[0.044, 16, 8]} />
            <meshStandardMaterial color="#6b2a3a" roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.01, 0.19]}>
            <sphereGeometry args={[0.024, 8, 8]} />
            <meshStandardMaterial color="#321a10" roughness={0.45} />
          </mesh>

          {/* Neon headphones */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
            <torusGeometry args={[0.22, 0.03, 16, 32, Math.PI]} />
            <meshStandardMaterial color="#ff00ff" roughness={0.06} metalness={0.96} emissive="#ff00ff" emissiveIntensity={0.6} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={`hp-cup-${side}`} position={[side * 0.22, -0.02, 0]}>
              <mesh rotation={[0, Math.PI / 2, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.048, 32]} />
                <meshStandardMaterial color="#060606" metalness={0.92} />
              </mesh>
              <mesh rotation={[0, Math.PI / 2, 0]} position={[side * 0.028, 0, 0]}>
                <circleGeometry args={[0.065, 32]} />
                <meshBasicMaterial color="#00ffcc" />
              </mesh>
            </group>
          ))}

          {/* Box braids with beads & rings */}
          <group ref={braidsRef} position={[0, 0.05, 0]}>
            {braids.map((b) => {
              if (!b) return null;
              return (
                <group key={b.i} position={[Math.sin(b.angle) * 0.19, -0.1, Math.cos(b.angle) * 0.17]} rotation={[0.15 + b.swayOffset * 0.12, 0, b.angle * 0.2]}>
                  <mesh>
                    <cylinderGeometry args={[0.016, 0.007, b.len, 8]} />
                    <meshStandardMaterial color={b.isCyan ? "#00ccaa" : "#050505"} roughness={0.85} />
                  </mesh>
                  {b.hasBead && (
                    <mesh position={[0, -b.len * 0.38, 0]}>
                      <sphereGeometry args={[0.022, 8, 8]} />
                      <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.05} emissive="#ffa500" emissiveIntensity={0.4} />
                    </mesh>
                  )}
                  {b.hasRing && (
                    <mesh position={[0, -b.len * 0.22, 0]}>
                      <torusGeometry args={[0.019, 0.005, 6, 12]} />
                      <meshStandardMaterial color="#c0c0c0" metalness={0.95} roughness={0.08} />
                    </mesh>
                  )}
                </group>
              );
            })}
            <mesh position={[0, 0.14, -0.04]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#050505" roughness={0.92} />
            </mesh>
          </group>
        </group>

        {/* Golden choker */}
        <mesh position={[0, 1.5, 0]}>
          <torusGeometry args={[0.095, 0.015, 8, 32]} />
          <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.03} emissive="#ffa500" emissiveIntensity={0.2} />
        </mesh>

        {/* Arms */}
        <group ref={leftArmRef} position={[-0.36, 1.32, 0]}>
          <mesh position={[0, -0.24, 0.14]} rotation={[-0.3, 0, 0.12]}>
            <capsuleGeometry args={[0.06, 0.44, 8, 8]} />
            <meshStandardMaterial color="#2d1610" roughness={0.5} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.36, 1.32, 0]}>
          <mesh position={[0, -0.24, 0.14]} rotation={[-0.3, 0, -0.12]}>
            <capsuleGeometry args={[0.06, 0.44, 8, 8]} />
            <meshStandardMaterial color="#2d1610" roughness={0.5} />
          </mesh>
        </group>

        {/* Legs */}
        {[-1, 1].map((side) => (
          <group key={`leg-${side}`}>
            <mesh position={[side * 0.12, 0.48, 0]} castShadow>
              <capsuleGeometry args={[0.078, 0.6, 8, 8]} />
              <meshStandardMaterial color="#080814" roughness={0.75} />
            </mesh>
            <mesh position={[side * 0.12, 0.13, 0.045]}>
              <boxGeometry args={[0.12, 0.045, 0.18]} />
              <meshBasicMaterial color="#ff00ff" transparent opacity={0.3} />
            </mesh>
          </group>
        ))}

        {/* Name tag */}
        <Billboard position={[0, 2.5, 0]}>
          <Text fontSize={0.14} color="#00ffcc" anchorX="center" anchorY="middle" material-toneMapped={false} outlineWidth={0.007} outlineColor="#000000">
            {"\uD83C\uDFA7 DUA (DJ MAIN)"}
          </Text>
        </Billboard>

        {/* DJ glow ring */}
        <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.7, 0.85, 64]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.15} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
    </Float>
  );
}

/* ═══════════════════════════════════════════════════════
   DUA 2.0 HOLOGRAPHIC PRESENTATION SCREEN
   The emotional and visual climax of the concert.
   ═══════════════════════════════════════════════════════ */

function DUA2PresentationScreen({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (groupRef.current) {
      /* Subtle floating hover */
      groupRef.current.position.y = 4.5 + Math.sin(t * 0.8) * 0.15;
    }
    if (frameRef.current) {
      (frameRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.08 + Math.sin(t * 2) * 0.03;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(t * 1.5) * 0.02;
      glowRef.current.scale.set(scale, scale, 1);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.04 + Math.sin(t * 2.5) * 0.02;
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={[0, 4.5, -8]}>
      {/* Main screen surface — dark transparent */}
      <mesh>
        <planeGeometry args={[10, 5.5]} />
        <meshBasicMaterial color="#030310" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Holographic border frame */}
      <mesh ref={frameRef}>
        <planeGeometry args={[10.3, 5.8]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Glow halo behind screen */}
      <mesh ref={glowRef} position={[0, 0, -0.5]}>
        <planeGeometry args={[14, 8]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.05} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* ── DUA 2.0 Title ── */}
      <Text
        position={[0, 2, 0.02]}
        fontSize={0.55}
        color="#00ffcc"
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        outlineWidth={0.015}
        outlineColor="#003322"
        maxWidth={9}
      >
        DUA 2.0
      </Text>

      {/* ── Main Subtitle ── */}
      <Text
        position={[0, 1.2, 0.02]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        maxWidth={9}
      >
        A Primeira IA Lusofona com Identidade Propria, Rosto e Voz
      </Text>

      {/* ── Tools Grid ── */}
      <Text
        position={[0, 0.4, 0.02]}
        fontSize={0.16}
        color="#a5f3fc"
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        maxWidth={9}
      >
        Mais de 60 ferramentas completas:
      </Text>

      {/* Tool category pills */}
      {[
        { x: -3.2, label: "\uD83C\uDFB5 Musica" },
        { x: -1.6, label: "\uD83C\uDFA8 Imagem" },
        { x: 0, label: "\uD83C\uDFAC Video" },
        { x: 1.6, label: "\uD83C\uDFA8 Design" },
        { x: 3.2, label: "\uD83D\uDCBC Carreira" },
      ].map((tool) => (
        <group key={tool.label} position={[tool.x, -0.2, 0.02]}>
          <mesh>
            <planeGeometry args={[1.4, 0.35]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.06} />
          </mesh>
          <Text fontSize={0.11} color="#00ffcc" anchorX="center" anchorY="middle" material-toneMapped={false}>
            {tool.label}
          </Text>
        </group>
      ))}

      {/* Backstage tool */}
      <group position={[0, -0.7, 0.02]}>
        <mesh>
          <planeGeometry args={[2, 0.35]} />
          <meshBasicMaterial color="#ff00ff" transparent opacity={0.06} />
        </mesh>
        <Text fontSize={0.11} color="#ff00ff" anchorX="center" anchorY="middle" material-toneMapped={false}>
          {"\uD83C\uDFA4 Backstage & Producao"}
        </Text>
      </group>

      {/* ═══ CRIOULO HIGHLIGHT — the biggest differentiator ═══ */}
      <group position={[0, -1.3, 0.02]}>
        {/* Background glow for emphasis */}
        <mesh>
          <planeGeometry args={[9, 0.7]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.04} />
        </mesh>
        <Text
          position={[0, 0.1, 0.01]}
          fontSize={0.15}
          color="#ffd700"
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
          maxWidth={8.5}
          fontWeight={700}
        >
          {"\uD83C\uDDE8\uD83C\uDDFB \uD83C\uDDEC\uD83C\uDDFC A PRIMEIRA IA DO MUNDO"}
        </Text>
        <Text
          position={[0, -0.15, 0.01]}
          fontSize={0.14}
          color="#ffd700"
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
          maxWidth={8.5}
        >
          que fala crioulo nativo de Cabo Verde e Guine-Bissau
        </Text>
      </group>

      {/* ── Live Demo labels ── */}
      <Text
        position={[0, -2.2, 0.02]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        maxWidth={9}
      >
        DEMO AO VIVO: Musica + Imagem + Video + Gestao em PT e Crioulo
      </Text>

      {/* Scan line for holographic feel */}
      <HolographicScanLine />

      {/* Corner accents */}
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => (
        <group key={`corner-${i}`} position={[sx * 4.9, sy * 2.65, 0.03]}>
          <mesh>
            <planeGeometry args={[0.3, 0.02]} />
            <meshBasicMaterial color="#00ffcc" />
          </mesh>
          <mesh>
            <planeGeometry args={[0.02, 0.3]} />
            <meshBasicMaterial color="#00ffcc" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HolographicScanLine() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      const y = ((s.clock.elapsedTime * 0.5) % 1) * 5.5 - 2.75;
      ref.current.position.y = y;
      (ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.08 * (1 - Math.abs(y) / 2.75);
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, 0.03]}>
      <planeGeometry args={[10, 0.02]} />
      <meshBasicMaterial color="#00ffcc" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════
   GUEST ARTIST AVATAR — reusable for VADO MKA, UZZY, ESTRACA
   Each enters cinematically from offstage with light beams.
   ═══════════════════════════════════════════════════════ */

/*
  GLB MODEL INTEGRATION FOR GUEST ARTISTS:
  Replace the procedural avatar with a GLB model:

  import { useGLTF } from "@react-three/drei";

  function GuestArtistAvatar({ name, glbPath, ... }) {
    const { scene } = useGLTF(glbPath);
    // Clone to allow multiple instances
    const clone = useMemo(() => scene.clone(), [scene]);
    return <primitive object={clone} position={position} scale={1.2} />;
  }

  // Preload all models:
  // useGLTF.preload("/models/vado-mka.glb");
  // useGLTF.preload("/models/uzzy.glb");
  // useGLTF.preload("/models/estraca.glb");
  // Place .glb files in /public/models/
*/

interface GuestArtistProps {
  name: string;
  active: boolean;
  position: [number, number, number];
  skinColor: string;
  shirtColor: string;
  accentColor: string;
  entranceSide: "left" | "right";
}

function GuestArtistAvatar({ name, active, position: targetPos, skinColor, shirtColor, accentColor, entranceSide }: GuestArtistProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const spotRef = useRef<THREE.Mesh>(null);
  const startTime = useRef<number | null>(null);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (!groupRef.current) return;

    if (!active) {
      groupRef.current.visible = false;
      startTime.current = null;
      return;
    }

    groupRef.current.visible = true;

    if (startTime.current === null) startTime.current = t;
    const elapsed = t - startTime.current;

    /* Cinematic entrance — slide in from side with ease */
    const entranceX = entranceSide === "left" ? -20 : 20;
    const prog = Math.min(elapsed / 2.5, 1);
    const ease = 1 - Math.pow(1 - prog, 4);

    const x = entranceX + (targetPos[0] - entranceX) * ease;
    const bounceY = targetPos[1] + Math.sin(t * 3.5) * 0.08;
    groupRef.current.position.set(x, bounceY, targetPos[2]);

    /* Face the audience */
    groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;

    /* Entrance glow burst */
    if (glowRef.current) {
      const glowIntensity = prog < 1 ? 0.5 * (1 - prog) : 0.08 + Math.sin(t * 2) * 0.04;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glowIntensity;
      glowRef.current.rotation.z = t * 0.3;
    }

    /* Spotlight cone */
    if (spotRef.current) {
      (spotRef.current.material as THREE.MeshBasicMaterial).opacity =
        prog < 1 ? 0.15 : 0.03 + Math.sin(t * 4) * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Entrance spotlight cone */}
      <mesh ref={spotRef} position={[0, 7, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 2.5, 14, 16, 1, true]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Entrance glow ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1, 1.5, 64]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.15} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Body */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.54, 16, 32]} />
        <meshStandardMaterial color={shirtColor} roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} metalness={0.05} />
      </mesh>

      {/* Eyes */}
      {[-1, 1].map((side) => (
        <mesh key={`eye-${side}`} position={[side * 0.065, 1.74, 0.17]}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshStandardMaterial color="#1a0a05" roughness={0.25} />
        </mesh>
      ))}

      {/* Hair — short style */}
      <mesh position={[0, 1.85, -0.02]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#050505" roughness={0.92} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.54, 0]}>
        <cylinderGeometry args={[0.06, 0.085, 0.14]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.36, 1.2, 0.06]} rotation={[-0.3, 0, 0.4]}>
        <capsuleGeometry args={[0.055, 0.42, 8, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} />
      </mesh>
      <mesh position={[0.36, 1.2, 0.06]} rotation={[-0.3, 0, -0.4]}>
        <capsuleGeometry args={[0.055, 0.42, 8, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} />
      </mesh>

      {/* Microphone in hand */}
      <mesh position={[0.38, 1.55, 0.18]} rotation={[-0.8, 0, -0.3]}>
        <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.37, 1.63, 0.22]} rotation={[-0.8, 0, -0.3]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Legs */}
      {[-1, 1].map((side) => (
        <mesh key={`leg-${side}`} position={[side * 0.12, 0.48, 0]} castShadow>
          <capsuleGeometry args={[0.078, 0.6, 8, 8]} />
          <meshStandardMaterial color="#0a0a14" roughness={0.75} />
        </mesh>
      ))}

      {/* Shoes with accent */}
      {[-1, 1].map((side) => (
        <mesh key={`shoe-${side}`} position={[side * 0.12, 0.13, 0.045]}>
          <boxGeometry args={[0.12, 0.045, 0.18]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Accessory: chain */}
      <mesh position={[0, 1.5, 0.12]}>
        <torusGeometry args={[0.06, 0.008, 6, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.04} emissive="#ffa500" emissiveIntensity={0.3} />
      </mesh>

      {/* Name tag */}
      <Billboard position={[0, 2.4, 0]}>
        <Text fontSize={0.14} color={accentColor} anchorX="center" anchorY="middle" material-toneMapped={false} outlineWidth={0.007} outlineColor="#000000">
          {name}
        </Text>
      </Billboard>

      {/* Floor particles at entrance */}
      <Sparkles count={60} scale={3} size={2} speed={0.5} opacity={0.3} color={accentColor} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   AUDIENCE — cinematic entrance
   ═══════════════════════════════════════════════════════ */

const SKIN_TONES = ["#8d5524", "#c68642", "#e0ac69", "#f1c27d", "#ffdbac", "#3b2219", "#4a2c14", "#291711"];
const SHIRT_COLORS = ["#ff0055", "#00ffcc", "#ffffff", "#1a1a1a", "#ffcc00", "#8b5cf6", "#3b82f6", "#ef4444", "#ec4899", "#10b981"];
const FLAGS = ["PT", "CV", "GW", "BR", "MZ", "AO", "ST", "TL"];
const NAMES = ["Luna", "DJ_Neon", "Estrela", "Cosmic", "Afro_Beat", "VIP_Star", "MoonWalker", "BassHead", "Melodia", "Ritmo", "Groove", "Vibe", "Pulse", "Flow", "Wave"];

function AudienceAvatar({
  delay, target, shirt, skin, flag, name, idx,
}: {
  delay: number; target: [number, number, number]; shirt: string; skin: string; flag: string; name: string; idx: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (!ref.current) return;
    if (t < delay) { ref.current.visible = false; return; }
    ref.current.visible = true;
    const at = t - delay;
    const [tx, ty, tz] = target;
    const side = tx < 0 ? -1 : 1;
    const startX = side * 22;
    const prog = Math.min(at * 0.28, 1);
    const ease = 1 - Math.pow(1 - prog, 3);

    if (prog < 1) {
      ref.current.position.set(startX + (tx - startX) * ease, ty + Math.sin(at * 12) * 0.04, tz);
      ref.current.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      ref.current.position.set(tx, ty + Math.sin(t * 3.5 + idx * 0.5) * 0.14, tz);
      const faceAngle = Math.atan2(-tx, -(tz + 3));
      ref.current.rotation.y += (faceAngle - ref.current.rotation.y) * 0.05;
      ref.current.rotation.z = Math.sin(t * 2.5 + idx) * 0.1;
    }
    if (armLRef.current && prog >= 1) {
      armLRef.current.rotation.x = Math.sin(t * 4.2 + idx) * 0.5 + 0.3;
      armLRef.current.rotation.z = Math.sin(t * 2 + idx) * 0.2 + 0.5;
    }
    if (armRRef.current && prog >= 1) {
      armRRef.current.rotation.x = Math.sin(t * 3.8 + idx + 1) * 0.5 + 0.3;
      armRRef.current.rotation.z = Math.sin(t * 2.3 + idx + 1) * -0.2 - 0.5;
    }
  });

  return (
    <group ref={ref}>
      <mesh castShadow position={[0, 0.42, 0]}>
        <capsuleGeometry args={[0.15, 0.34, 8, 16]} />
        <meshStandardMaterial color={shirt} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.45} />
      </mesh>
      <mesh ref={armLRef} position={[-0.22, 0.62, 0.06]} rotation={[0.3, 0, 0.5]}>
        <capsuleGeometry args={[0.042, 0.3, 4, 8]} />
        <meshStandardMaterial color={skin} roughness={0.45} />
      </mesh>
      <mesh ref={armRRef} position={[0.22, 0.62, 0.06]} rotation={[0.3, 0, -0.5]}>
        <capsuleGeometry args={[0.042, 0.3, 4, 8]} />
        <meshStandardMaterial color={skin} roughness={0.45} />
      </mesh>
      <mesh position={[-0.07, 0.1, 0]}>
        <capsuleGeometry args={[0.042, 0.22, 4, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.07, 0.1, 0]}>
        <capsuleGeometry args={[0.042, 0.22, 4, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.23, 0.82, 0.08]} rotation={[0.5, 0, -0.8]}>
        <cylinderGeometry args={[0.008, 0.008, 0.16, 8]} />
        <meshBasicMaterial color={idx % 2 === 0 ? "#00ffcc" : "#ff00ff"} />
      </mesh>
      <Billboard position={[0, 1.2, 0]}>
        <Text fontSize={0.055} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.007} outlineColor="#000000">
          {`[${flag}] ${name}`}
        </Text>
      </Billboard>
    </group>
  );
}

function AudienceCrowd({ viewerCount }: { viewerCount: number }) {
  const avatars = useMemo(() => {
    const count = Math.min(Math.max(viewerCount * 2, 16), 45);
    const result = [];
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 12);
      const col = i % 12;
      const totalInRow = Math.min(12, count - row * 12);
      const angle = ((col - (totalInRow - 1) / 2) / totalInRow) * Math.PI * 0.9 +
        (((i * 7 + 3) % 11) / 11) * 0.06;
      const radius = 5.5 + row * 1.9 + (((i * 13 + 5) % 9) / 9) * 0.6;
      result.push({
        target: [Math.sin(angle) * radius, 0, Math.cos(angle) * radius - 2] as [number, number, number],
        delay: 1.5 + (((i * 17 + 7) % 23) / 23) * 9,
        shirt: SHIRT_COLORS[i % SHIRT_COLORS.length],
        skin: SKIN_TONES[i % SKIN_TONES.length],
        flag: FLAGS[i % FLAGS.length],
        name: NAMES[i % NAMES.length] + `_${i}`,
        idx: i,
      });
    }
    return result;
  }, [viewerCount]);

  return (
    <group>
      {avatars.map((a, i) => <AudienceAvatar key={i} {...a} />)}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   CINEMATIC LIGHTING — concert + volumetric lasers
   ═══════════════════════════════════════════════════════ */

function CinematicLighting({ phase }: { phase: ConcertPhase }) {
  const lasersRef = useRef<THREE.Group>(null);
  const strobeRef = useRef<THREE.PointLight>(null);
  const sweepRef = useRef<THREE.Group>(null);

  /* Intensity multiplier per phase */
  const intensity = phase === "dua2_presentation" ? 1.5 :
    phase === "estraca_performance" ? 1.8 : 1;

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (lasersRef.current) lasersRef.current.rotation.y = t * 0.1;
    if (sweepRef.current) sweepRef.current.rotation.y = Math.sin(t * 0.4) * 0.8;
    if (strobeRef.current) {
      strobeRef.current.intensity = Math.sin(t * 20) > 0.94 ? 10 * intensity : 0;
    }
  });

  return (
    <>
      <ambientLight intensity={0.1} color="#060612" />
      <directionalLight position={[0, 28, -55]} intensity={0.3} color="#7788aa" />

      {/* Main DJ spotlight */}
      <spotLight
        position={[0, 14, 4]}
        angle={0.28}
        penumbra={0.9}
        intensity={6 * intensity}
        color="#00ffcc"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight position={[-4, 11, 0]} angle={0.4} penumbra={0.75} intensity={4 * intensity} color="#ff00ff" />
      <spotLight position={[4, 11, 0]} angle={0.4} penumbra={0.75} intensity={4 * intensity} color="#2244ff" />
      <spotLight position={[0, 9, -9]} angle={0.55} penumbra={0.9} intensity={2.5} color="#ffd700" />
      <spotLight position={[0, 5, -6]} angle={0.8} penumbra={1} intensity={1.5} color="#8844ff" />

      {/* Strobe */}
      <pointLight ref={strobeRef} position={[0, 7, -2]} intensity={0} color="#ffffff" />

      {/* Sweeping spotlight */}
      <group ref={sweepRef} position={[0, 12, -3]}>
        <spotLight position={[0, 0, 0]} target-position={[0, -12, 5]} angle={0.15} penumbra={0.5} intensity={3 * intensity} color="#00ffcc" />
      </group>

      {/* Laser cones */}
      <group ref={lasersRef} position={[0, 8, -3]}>
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const colors = ["#00ffcc", "#ff00ff", "#2244ff", "#ffd700", "#ff0055"];
          return (
            <mesh key={i} rotation={[Math.PI / 3, 0, a]} position={[Math.sin(a) * 1.2, -3, Math.cos(a) * 1.2]}>
              <cylinderGeometry args={[0.008, 2.5, 24, 16, 1, true]} />
              <meshBasicMaterial color={colors[i % colors.length]} transparent opacity={0.025} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          );
        })}
      </group>

      {/* God-ray planes */}
      {[-2, -0.5, 0.5, 2].map((x, i) => (
        <mesh key={`godray-${i}`} position={[x * 2, 6, -8]} rotation={[0.12, 0, x * 0.15]}>
          <planeGeometry args={[0.35, 16]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#00ffcc" : "#8844ff"} transparent opacity={0.01} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Extra guest performance spotlights */}
      {(phase === "vado_performance" || phase === "uzzy_performance" || phase === "estraca_performance") && (
        <>
          <spotLight position={[-6, 12, 2]} angle={0.2} penumbra={0.8} intensity={8} color={phase === "vado_performance" ? "#ff4400" : phase === "uzzy_performance" ? "#4488ff" : "#ffd700"} />
          <spotLight position={[6, 12, 2]} angle={0.2} penumbra={0.8} intensity={8} color="#ff00ff" />
        </>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   FLOATING PARTICLES
   ═══════════════════════════════════════════════════════ */

function FloatingParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 300;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 35;
      arr[i * 3 + 1] = Math.random() * 18;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 35 - 5;
    }
    return arr;
  }, []);

  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.012;
      const pos = ref.current.geometry.attributes.position;
      for (let i = 0; i < count; i++) {
        const y = pos.getY(i);
        pos.setY(i, y + Math.sin(s.clock.elapsedTime * 0.5 + i * 0.7) * 0.002);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.055} color="#00ffcc" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN SCENE EXPORT
   ═══════════════════════════════════════════════════════ */

export default function MoonScene({
  viewerCount = 10,
  concertPhase = "opening" as ConcertPhase,
}: {
  viewerCount?: number;
  concertPhase?: ConcertPhase;
}) {
  const showDUA2Screen = concertPhase === "dua2_presentation" || concertPhase === "finale";
  const showVado = concertPhase === "vado_performance" || concertPhase === "finale";
  const showUzzy = concertPhase === "uzzy_performance" || concertPhase === "finale";
  const showEstraca = concertPhase === "estraca_performance" || concertPhase === "finale";

  return (
    <div className="absolute inset-0 w-full h-full bg-[#030305]">
      <Canvas
        shadows
        camera={{ position: [0, 3.5, 9], fov: 52, near: 0.1, far: 350 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <color attach="background" args={["#030305"]} />
        <fog attach="fog" args={["#030305", 12, 60]} />

        <Suspense fallback={null}>
          <MassiveMoon />

          <Stars radius={140} depth={80} count={8000} factor={5.5} saturation={0.12} fade speed={0.5} />
          <Sparkles count={400} scale={20} size={2} speed={0.25} opacity={0.18} color="#00ffcc" />
          <Sparkles count={180} scale={16} size={3} speed={0.15} opacity={0.1} color="#ff00ff" />
          <Sparkles count={80} scale={12} size={1.5} speed={0.3} opacity={0.08} color="#ffd700" />

          <CinematicLighting phase={concertPhase} />
          <HolographicStage />
          <DJBooth />
          <DJStarAvatar />

          {/* DUA 2.0 Holographic Presentation Screen */}
          <DUA2PresentationScreen active={showDUA2Screen} />

          {/* Guest Artist Avatars — cinematic entrances */}
          <GuestArtistAvatar
            name={"\uD83C\uDFA4 VADO MKA"}
            active={showVado}
            position={[-4, 0, -1]}
            skinColor="#3b2219"
            shirtColor="#ff4400"
            accentColor="#ff6600"
            entranceSide="left"
          />
          <GuestArtistAvatar
            name={"\uD83C\uDFA4 UZZY"}
            active={showUzzy}
            position={[4, 0, -1]}
            skinColor="#4a2c14"
            shirtColor="#2244ff"
            accentColor="#4488ff"
            entranceSide="right"
          />
          <GuestArtistAvatar
            name={"\uD83C\uDFA4 ESTRACA"}
            active={showEstraca}
            position={[0, 0, 1]}
            skinColor="#291711"
            shirtColor="#ffd700"
            accentColor="#ffaa00"
            entranceSide="left"
          />

          <AudienceCrowd viewerCount={viewerCount} />
          <FloatingParticles />

          <OrbitControls
            enablePan={false}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={2}
            maxDistance={20}
            target={[0, 1.3, -1.5]}
            autoRotate
            autoRotateSpeed={0.2}
            enableDamping
            dampingFactor={0.035}
          />

          <PostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
}
