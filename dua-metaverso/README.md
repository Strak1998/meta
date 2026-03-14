# 🌕 DUA Metaverso da Lua

**Primeiro concerto com DJ Avatar IA ao vivo no metaverso lunar.**

Next.js 16 + Three.js + LiveKit • Ultra-premium WebGL experience

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| 3D Engine | Three.js r183 via @react-three/fiber + drei |
| Post-processing | @react-three/postprocessing (Bloom, Noise, Vignette) |
| Voice/Video | LiveKit (@livekit/components-react) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Fonts | Orbitron (headings) + Montserrat (body) |
| Animations | Framer Motion, CSS keyframes, canvas-confetti |

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout, fonts, SEO metadata
│   ├── page.tsx            # Main orchestrator page
│   ├── globals.css         # Theme, 3D text classes, animations
│   └── api/
│       ├── chat/route.ts   # SSE live chat endpoint
│       └── reactions/route.ts
├── components/
│   ├── three/
│   │   ├── MoonScene.tsx   # Core 3D scene (Moon, DJ, audience, lighting)
│   │   └── HeroOverlay.tsx # Title overlay with 3D text
│   ├── layout/
│   │   ├── TopBar.tsx      # Navigation bar
│   │   ├── LoadingScreen.tsx
│   │   ├── Footer.tsx
│   │   └── ReactionsOverlay.tsx
│   ├── music/
│   │   ├── MusicModal.tsx  # Music request dialog
│   │   └── WaveformVisualizer.tsx
│   ├── voice/
│   │   └── VoiceRoom.tsx   # Voice room (LiveKit-ready)
│   ├── sidebar/
│   │   └── Sidebar.tsx     # Chat + queue sidebar
│   └── guest/
│       └── GuestSystem.tsx # Join dialog
└── lib/
    ├── use-live-chat.ts    # SSE chat hook
    ├── live-store.ts       # In-memory chat store
    └── utils.ts
```

---

## Replacing the DJ Avatar with a GLTF Model

The DJ avatar in `MoonScene.tsx` is built with Three.js primitives. To use a custom 3D model:

1. Download a character from [Mixamo](https://www.mixamo.com/) or [Ready Player Me](https://readyplayer.me/)
2. Export as `.glb` and place in `public/models/dj-avatar.glb`
3. Replace the `DJStarAvatar` component:

```tsx
import { useGLTF, useAnimations } from "@react-three/drei";

function DJStarAvatar() {
  const { scene, animations } = useGLTF("/models/dj-avatar.glb");
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    actions["DJMix"]?.play(); // Use your animation name
  }, [actions]);

  return <primitive object={scene} scale={1.2} position={[0, 0, -2.5]} />;
}

useGLTF.preload("/models/dj-avatar.glb");
```

---

## LiveKit Voice Room Setup

The `VoiceRoom` component is ready for real LiveKit integration:

1. Create a [LiveKit Cloud](https://cloud.livekit.io/) account
2. Add environment variables:

```env
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

3. Create a token endpoint at `src/app/api/livekit/route.ts`:

```ts
import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const identity = req.nextUrl.searchParams.get("identity") || "guest";
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity }
  );
  token.addGrant({ room: "DUA-Metaverso-Lua", roomJoin: true });
  return NextResponse.json({ token: await token.toJwt() });
}
```

4. Update `VoiceRoom.tsx`:

```tsx
import { LiveKitRoom, RoomAudioRenderer, useTracks, ParticipantTile } from "@livekit/components-react";
import { Track } from "livekit-client";

function VoiceRoom({ token }: { token: string }) {
  return (
    <LiveKitRoom serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} token={token} connect>
      <RoomAudioRenderer />
      <ActiveParticipants />
    </LiveKitRoom>
  );
}
```

---

## Lunar Textures

To add a realistic Moon texture to the background sphere:

1. Download a Moon texture (e.g., from [Solar Textures](https://www.solarsystemscope.com/textures/))
2. Place as `public/textures/moon.jpg`
3. In `MoonScene.tsx`, update `MassiveMoon`:

```tsx
import { useTexture } from "@react-three/drei";

function MassiveMoon() {
  const texture = useTexture("/textures/moon.jpg");
  return (
    <mesh position={[0, 18, -60]}>
      <sphereGeometry args={[28, 128, 128]} />
      <meshStandardMaterial map={texture} roughness={0.95} />
    </mesh>
  );
}
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Open music request modal |
| Mouse drag | Orbit camera |
| Scroll | Zoom in/out |

---

## Deployment

```bash
npm run build    # Production build
npm start        # Start production server
```

Deploy to Vercel:
```bash
npx vercel --prod
```

---

## License

MIT
