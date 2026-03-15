'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function ConcertLighting() {
  const spot1Ref = useRef<THREE.SpotLight>(null)
  const spot2Ref = useRef<THREE.SpotLight>(null)
  const spot3Ref = useRef<THREE.SpotLight>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (spot1Ref.current) {
      spot1Ref.current.position.x = Math.sin(t * 0.25) * 4
      spot1Ref.current.position.z = Math.cos(t * 0.25) * 2 + 3
    }
    if (spot2Ref.current) {
      spot2Ref.current.position.x = Math.sin(t * 0.25 + Math.PI) * 4
      spot2Ref.current.position.z = Math.cos(t * 0.25 + Math.PI) * 2 + 3
    }
    // Sweeping gold follow-spot
    if (spot3Ref.current) {
      spot3Ref.current.position.x = Math.sin(t * 0.15) * 2
      spot3Ref.current.position.z = Math.cos(t * 0.3) * 1.5 + 2
    }
  })

  return (
    <>
      {/* BASE — sem isto nada e visivel */}
      <ambientLight intensity={0.85} color="#1a1a3e" />

      {/* HEMISFERICA — ceu nocturno vs chao da lua */}
      <hemisphereLight args={['#0d0d2b', '#00ffcc', 0.65]} />

      {/* DIRECTIONAL PRINCIPAL — key light para MeshToonMaterial */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={2.5}
        color="#ffffff"
      />

      {/* DIRECTIONAL SECUNDARIA — fill diagonal oposta, evita sombras duras */}
      <directionalLight
        position={[-4, 8, 3]}
        intensity={1.2}
        color="#e0e0ff"
      />

      {/* SPOTLIGHT CYAN — luz de palco principal */}
      <spotLight
        ref={spot1Ref}
        position={[4, 14, 4]}
        angle={0.4}
        penumbra={0.7}
        intensity={150}
        color="#00ffcc"
        castShadow={false}
      />

      {/* SPOTLIGHT VIOLETA — luz de palco secundaria */}
      <spotLight
        ref={spot2Ref}
        position={[-4, 14, 4]}
        angle={0.4}
        penumbra={0.7}
        intensity={100}
        color="#c084fc"
        castShadow={false}
      />

      {/* SPOTLIGHT GOLD — follow-spot varredor */}
      <spotLight
        ref={spot3Ref}
        position={[0, 16, 2]}
        angle={0.3}
        penumbra={0.8}
        intensity={60}
        color="#ffd700"
        castShadow={false}
      />

      {/* FILL FRONTAL — ilumina rostos directamente, critico */}
      <pointLight
        position={[0, 4, 10]}
        intensity={55}
        color="#ffffff"
        distance={30}
        decay={2}
      />

      {/* KEY LATERAL ESQUERDA — define forma 3D dos avatares */}
      <pointLight
        position={[-8, 5, 4]}
        intensity={30}
        color="#88ccff"
        distance={20}
        decay={2}
      />

      {/* KEY LATERAL DIREITA — simetria */}
      <pointLight
        position={[8, 5, 4]}
        intensity={30}
        color="#ff88cc"
        distance={20}
        decay={2}
      />

      {/* RIM TRASEIRO — separa avatares do fundo escuro */}
      <pointLight
        position={[0, 8, -10]}
        intensity={35}
        color="#fbbf24"
        distance={35}
        decay={2}
      />

      {/* TOP HAIR LIGHT — destaque no topo da cabeca */}
      <pointLight
        position={[0, 12, 2]}
        intensity={20}
        color="#ffffff"
        distance={18}
        decay={2}
      />

      {/* BOUNCE DO CHAO — simula reflexo da superficie lunar */}
      <pointLight
        position={[0, -0.5, 4]}
        intensity={22}
        color="#00ccaa"
        distance={15}
        decay={2}
      />
    </>
  )
}
