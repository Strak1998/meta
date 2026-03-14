const fs = require('fs');
const file = 'dua-metaverso/src/components/three/MoonScene.tsx';
let txt = fs.readFileSync(file, 'utf8');

const newDJAvatar = `
// ═══════════════════════════════════════════
// DJ AVATAR — Mulher Negra com Tranças
// ═══════════════════════════════════════════

function DJAvatar() {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      // Body bouncing to the beat
      groupRef.current.position.y = Math.sin(t * 4) * 0.05 + 0.1;
    }
    if (leftArmRef.current) {
      // Left arm scratching/mixing
      leftArmRef.current.rotation.x = Math.sin(t * 8) * 0.2 - 0.5;
    }
    if (rightArmRef.current) {
      // Right arm turning knobs
      rightArmRef.current.rotation.x = Math.cos(t * 4) * 0.15 - 0.4;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.1, -1.6]}>
      {/* Torso (Cyberpunk Top) */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.4, 8, 16]} />
        <meshStandardMaterial color="#8b5cf6" roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.1]} />
        <meshStandardMaterial color="#3b2219" roughness={0.5} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshStandardMaterial color="#3b2219" roughness={0.5} />
      </mesh>

      {/* Tranças (Braids) */}
      <group position={[0, 1.65, 0]}>
        {Array.from({ length: 18 }).map((_, i) => {
          const angle = (i / 18) * Math.PI * 1.8 - Math.PI * 0.9;
          return (
            <mesh key={i} position={[Math.sin(angle) * 0.15, -0.1, Math.cos(angle) * 0.12 - 0.05]} rotation={[0.2, 0, angle * 0.4]}>
              <cylinderGeometry args={[0.012, 0.008, 0.35, 8]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
            </mesh>
          );
        })}
        {/* Top Braids Bun */}
        <mesh position={[0, 0.15, -0.05]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>
      </group>

      {/* DJ Headphones */}
      <group position={[0, 1.65, 0]}>
        {/* Headband */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <torusGeometry args={[0.17, 0.02, 16, 32, Math.PI]} />
          <meshStandardMaterial color="#00ffcc" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Ear cups */}
        <mesh position={[-0.17, -0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
          <meshStandardMaterial color="#111" />
          <mesh position={[0, 0.03, 0]}>
            <circleGeometry args={[0.04, 16]} />
            <meshBasicMaterial color="#00ffcc" />
          </mesh>
        </mesh>
        <mesh position={[0.17, -0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
          <meshStandardMaterial color="#111" />
          <mesh position={[0, 0.03, 0]}>
            <circleGeometry args={[0.04, 16]} />
            <meshBasicMaterial color="#00ffcc" />
          </mesh>
        </mesh>
      </group>
      
      {/* Golden Choker/Colar */}
      <mesh position={[0, 1.42, 0]}>
        <torusGeometry args={[0.07, 0.01, 8, 24]} />
        <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} />
      </mesh>

      {/* Arms (Pivoted at shoulders) */}
      {/* Left arm */}
      <group position={[-0.25, 1.2, 0]} ref={leftArmRef}>
        <mesh position={[0, -0.2, 0.1]} rotation={[-0.2, 0, 0]}>
          <capsuleGeometry args={[0.04, 0.35, 4, 8]} />
          <meshStandardMaterial color="#3b2219" roughness={0.5} />
        </mesh>
      </group>
      {/* Right arm */}
      <group position={[0.25, 1.2, 0]} ref={rightArmRef}>
        <mesh position={[0, -0.2, 0.1]} rotation={[-0.2, 0, 0]}>
          <capsuleGeometry args={[0.04, 0.35, 4, 8]} />
          <meshStandardMaterial color="#3b2219" roughness={0.5} />
        </mesh>
      </group>

      {/* Legs */}
      <mesh position={[-0.1, 0.45, 0]}>
        <capsuleGeometry args={[0.05, 0.5, 4, 8]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      <mesh position={[0.1, 0.45, 0]}>
        <capsuleGeometry args={[0.05, 0.5, 4, 8]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>

      {/* Name tag */}
      <Billboard position={[0, 2.1, 0]}>
        <Text fontSize={0.12} color="#00ffcc" anchorX="center" anchorY="middle" font="/fonts/inter.woff">
          🎧 DUA (IA DJ)
        </Text>
      </Billboard>
    </group>
  );
}

// ═══════════════════════════════════════════
// AUDIENCE AVATARS — Reais entrando em cena
// ═══════════════════════════════════════════

const SKIN_TONES = ["#8d5524", "#c68642", "#e0ac69", "#f1c27d", "#ffdbac", "#3b2219", "#4a2c14", "#291711"];
const SHIRT_COLORS = ["#ff0055", "#00ffcc", "#ffffff", "#1a1a1a", "#ffcc00", "#8b5cf6", "#3b82f6", "#ef4444"];
const AUDIENCE_FLAGS = ["🇵🇹", "🇨🇻", "🇬🇼", "🇧🇷", "🇲🇿", "🇦🇴", "🌍", "🇹🇱"];

function AudienceAvatar({
  delay,
  targetPosition,
  color,
  skinTone,
  flag,
  name,
  index,
}: {
  delay: number;
  targetPosition: [number, number, number];
  color: string;
  skinTone: string;
  flag: string;
  name: string;
  index: number;
}) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      if (t < delay) {
        // Not spawned yet, stay far away
        ref.current.visible = false;
        return;
      }
      ref.current.visible = true;
      
      const activeT = t - delay;
      // Walking in smoothly from back
      const [tx, ty, tz] = targetPosition;
      
      // Interpolate Z for walking in
      const startZ = tz + 10;
      const progress = Math.min(activeT * 0.5, 1); // 2 seconds to walk to place
      const currentZ = startZ - (startZ - tz) * progress;
      
      // Stop walking and start dancing when in place
      if (progress < 1) {
        // Walking bounce
        ref.current.position.set(tx, ty + Math.sin(activeT * 10) * 0.04, currentZ);
        ref.current.rotation.z = Math.sin(activeT * 5) * 0.05;
      } else {
        // Dancing bounce
        ref.current.position.set(tx, ty + Math.sin(t * 3.5 + index * 0.7) * 0.08, tz);
        ref.current.rotation.z = Math.sin(t * 1.5 + index * 1.2) * 0.05;
      }
    }
  });

  return (
    <group ref={ref} position={[targetPosition[0], targetPosition[1], targetPosition[2] + 10]}>
      {/* Body / Shirt */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <capsuleGeometry args={[0.13, 0.32, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={skinTone} roughness={0.5} />
      </mesh>
      {/* Legs (Calças Jeans ou Escuras) */}
      <mesh position={[-0.07, 0.1, 0]}>
        <capsuleGeometry args={[0.04, 0.2, 4, 8]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      <mesh position={[0.07, 0.1, 0]}>
        <capsuleGeometry args={[0.04, 0.2, 4, 8]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      {/* Raised arms (cheering) */}
      <mesh position={[-0.2, 0.5, 0.05]} rotation={[0, 0, 0.6]}>
        <capsuleGeometry args={[0.035, 0.25, 4, 8]} />
        <meshStandardMaterial color={skinTone} roughness={0.5} />
      </mesh>
      <mesh position={[0.2, 0.5, 0.05]} rotation={[0, 0, -0.6]}>
        <capsuleGeometry args={[0.035, 0.25, 4, 8]} />
        <meshStandardMaterial color={skinTone} roughness={0.5} />
      </mesh>
      {/* Name + flag label */}
      <Billboard position={[0, 1.05, 0]}>
        <Text fontSize={0.06} color="#ffffff" anchorX="center" anchorY="middle" maxWidth={1}>
          {flag} {name}
        </Text>
      </Billboard>
      {/* Glow ring at feet to still show interactivity */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[0.13, 0.17, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function AudienceCrowd({ viewerCount }: { viewerCount: number }) {
  const avatars = useMemo(() => {
    const count = Math.min(Math.max(viewerCount, 8), 40); // Generate at least 8, max 40 for realism
    const result = [];
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 8);
      const col = i % 8;
      const totalInRow = Math.min(8, count - row * 8);
      // Give more varied organic positions instead of perfect rows
      const angle = (((col - (totalInRow - 1) / 2) / totalInRow) * Math.PI * 0.8) + (Math.random() * 0.2 - 0.1);
      const radius = 3.5 + row * 1.5 + (Math.random() * 0.8);

      result.push({
        targetPosition: [
          Math.sin(angle) * radius,
          0.05,
          Math.cos(angle) * radius - 1.5,
        ] as [number, number, number],
        delay: Math.random() * 5, // 0 to 5 seconds delay to enter
        color: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
        skinTone: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
        flag: AUDIENCE_FLAGS[Math.floor(Math.random() * AUDIENCE_FLAGS.length)],
        name: \`User\${Math.floor(Math.random()*999)}\`,
        index: i,
      });
    }
    // Sort by delay so they enter randomly from back
    return result;
  }, [viewerCount]);

  return (
    <group>
      {avatars.map((av, i) => (
        <AudienceAvatar key={i} {...av} />
      ))}
    </group>
  );
}
`

const regex = /\/\/ ═══════════════════════════════════════════\n\/\/ DJ AVATAR — Carlos with VIP crown(.*?)function StageLighting\(\) \{/s;

txt = txt.replace(regex, newDJAvatar + '\n// ═══════════════════════════════════════════\n// STAGE LIGHTING — Lasers, spotlights, beams\n// ═══════════════════════════════════════════\n\nfunction StageLighting() {');

fs.writeFileSync(file, txt);
console.log('done!');
