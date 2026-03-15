'use client'
import { useMemo, useRef } from 'react'
import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { AvatarFace, AvatarBody } from '@/types/user'
import { BODY_CONFIGS } from '@/lib/avatar-bodies'
import { CompositeAvatar } from './CompositeAvatar'

// Cria sprite Billboard com nome + bandeira em CanvasTexture
function makeNameplateTexture(name: string, flag: string, accentColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!

  // fundo semi-transparente arredondado
  ctx.clearRect(0, 0, 256, 64)
  ctx.fillStyle = 'rgba(3, 3, 5, 0.85)'
  ctx.beginPath()
  ctx.roundRect(0, 0, 256, 64, 8)
  ctx.fill()

  // borda em ciano
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(0, 0, 256, 64, 8)
  ctx.stroke()

  // bandeira
  ctx.font = '28px serif'
  ctx.fillText(flag, 10, 44)

  // nome
  ctx.font = 'bold 20px "Orbitron", monospace'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(name.substring(0, 12).toUpperCase(), 52, 40)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  return texture
}

interface StylizedAvatarProps {
  face: AvatarFace
  body: AvatarBody
  name: string
  countryFlag: string
  position?: [number, number, number]
  scale?: number
  isCurrentUser?: boolean
  animationOffset?: number
}

export function StylizedAvatar({
  face,
  body,
  name,
  countryFlag,
  position = [0, 0, 0],
  scale = 1,
  isCurrentUser = false,
  animationOffset = 0,
}: StylizedAvatarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  const accentColor = BODY_CONFIGS[body].accent || '#00ffcc'

  // Idle animation do anel/piso e parent bob
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime + animationOffset
    // Animacao geral group position (se existir para a multidao)
    groupRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.04
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.15
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5
      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.4 + Math.sin(t * 2) * 0.2
    }
  })

  // Nameplate texture
  const nameplateTexture = useMemo(
    () => makeNameplateTexture(name, countryFlag, accentColor),
    [name, countryFlag, accentColor]
  )

  return (
    <group ref={groupRef} position={position} scale={scale}>
      
      {/* Corpo e Rosto */}
      <CompositeAvatar face={face} body={body} idle={false} scale={1} />

      {/* ARO DE CHAO — apenas utilizador actual */}
      {isCurrentUser && (
        <mesh ref={ringRef} position={[0, -0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.36, 32]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* NAMEPLATE — Billboard com nome e bandeira */}
      <Billboard position={[0, 0.9, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh>
          <planeGeometry args={[0.7, 0.18]} />
          <meshBasicMaterial
            map={nameplateTexture}
            transparent
            depthWrite={false}
          />
        </mesh>
      </Billboard>

    </group>
  )
}
