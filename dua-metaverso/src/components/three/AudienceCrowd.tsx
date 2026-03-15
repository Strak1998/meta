'use client'
import { useMemo } from 'react'
import { StylizedAvatar } from './StylizedAvatar'
import type { AvatarFace, AvatarBody } from '@/types/user'

const FACES: AvatarFace[] = ['A', 'B', 'C']
const BODIES: AvatarBody[] = ['1', '2', '3']
const FLAGS_AND_COUNTRIES = [
  { flag: '🇵🇹', country: 'PT' },
  { flag: '🇧🇷', country: 'BR' },
  { flag: '🇨🇻', country: 'CV' },
  { flag: '🇦🇴', country: 'AO' },
  { flag: '🇲🇿', country: 'MZ' },
  { flag: '🇬🇼', country: 'GW' },
  { flag: '🇸🇹', country: 'ST' },
  { flag: '🇹🇱', country: 'TL' },
  { flag: '🇫🇷', country: 'FR' },
  { flag: '🇬🇧', country: 'GB' },
  { flag: '🇩🇪', country: 'DE' },
  { flag: '🇺🇸', country: 'US' },
]

// Nomes aleatorios lusofonos para a plateia gerada
const NAMES = ['KADU', 'LENA', 'ABEL', 'RITA', 'NUNO', 'ANA', 'IVAN', 'MAYA',
               'TITO', 'BIBI', 'DECO', 'LUNA', 'ZARA', 'KIKO', 'INES', 'BETO',
               'NIKA', 'LUCA', 'VERA', 'JOSE']

interface AudienceConfig {
  count: number
  rows: number
  spread: number
}

// Posicoes em arco semi-circular virado para o palco
function generateAudiencePositions(count: number, rows: number, spread: number) {
  const positions: [number, number, number][] = []
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / Math.ceil(count / rows))
    const posInRow = i % Math.ceil(count / rows)
    const totalInRow = Math.ceil(count / rows)
    const divisor = totalInRow > 1 ? totalInRow - 1 : 1
    const angle = ((posInRow / divisor) - 0.5) * spread * (Math.PI / 180)
    const radius = 4 + row * 1.8
    const x = Math.sin(angle) * radius
    const z = -Math.cos(angle) * radius + 2  // positivo = perto da camara
    const y = -0.3 + row * 0.05  // ligeiramente mais alto nas filas de tras
    positions.push([x, y, z])
  }
  return positions
}

export interface UserAvatarData {
  id: string
  name: string
  face: AvatarFace
  body: AvatarBody
  flag: string
  position: [number,number,number]
  isCurrentUser?: boolean
}

interface AudienceCrowdProps {
  count?: number
  userAvatars?: UserAvatarData[]
}

export function AudienceCrowd({ count = 16, userAvatars = [] }: AudienceCrowdProps) {
  const backgroundAvatars = useMemo(() => {
    const positions = generateAudiencePositions(count, 3, 110)
    return positions.map((pos, i) => ({
      id: `bg-${i}`,
      face: FACES[i % 3],
      body: BODIES[(i + 1) % 3],
      name: NAMES[i % NAMES.length],
      flag: FLAGS_AND_COUNTRIES[i % FLAGS_AND_COUNTRIES.length].flag,
      position: pos,
      animationOffset: i * 0.37,
      scale: 0.85 + (i % 3) * 0.06,
    }))
  }, [count])

  return (
    <group>
      {/* Avatares de fundo — gerados automaticamente */}
      {backgroundAvatars.map((av) => (
        <StylizedAvatar
          key={av.id}
          face={av.face}
          body={av.body}
          name={av.name}
          countryFlag={av.flag}
          position={av.position}
          scale={av.scale}
          animationOffset={av.animationOffset}
          isCurrentUser={false}
        />
      ))}
      {/* Avatares dos utilizadores reais — posicionados a frente */}
      {userAvatars.map((av) => (
        <StylizedAvatar
          key={av.id}
          face={av.face}
          body={av.body}
          name={av.name}
          countryFlag={av.flag}
          position={av.position}
          scale={1.0}
          isCurrentUser={av.isCurrentUser !== undefined ? av.isCurrentUser : true}
        />
      ))}
    </group>
  )
}
