# DUA Metaverso -- Architecture

## System Overview

DUA Metaverso is a Next.js 16 application that delivers a real-time virtual concert
experience. Viewers watch a 3D stage rendered with Three.js, interact via live chat,
join voice rooms through LiveKit, and receive stage direction from a backstage admin
dashboard -- all coordinated through Server-Sent Events (SSE).

```
+-----------------------------------------------------------------------+
|                           BROWSER (Viewer)                            |
|                                                                       |
|  +------------------+  +------------------+  +---------------------+  |
|  | Three.js Canvas  |  | Chat UI / React  |  | LiveKit Voice Room  |  |
|  | (MoonScene)      |  | (useLiveChat)    |  | (VoiceRoom)         |  |
|  +--------+---------+  +--------+---------+  +----------+----------+  |
|           |                      |                       |            |
|           |  +-------------------+---+                   |            |
|           |  |  useConcertEvents     |                   |            |
|           |  |  (EventSource client) |                   |            |
|           |  +----------+------------+                   |            |
+-----------------------------------------------------------------------+
              |            |                               |
              |  SSE       |  SSE + POST                   |  WebSocket
              |            |                               |
+-----------------------------------------------------------------------+
|                        NEXT.JS SERVER (Vercel)                        |
|                                                                       |
|  +--------------------+  +-------------------+  +------------------+  |
|  | /api/backstage/    |  | /api/chat         |  | /api/livekit-    |  |
|  |   events           |  | (GET=SSE,POST)    |  |   token          |  |
|  | (GET=SSE,POST=cmd) |  +--------+----------+  +--------+---------+  |
|  +--------+-----------+           |                       |           |
|           |                       |                       |           |
|  +--------v-----------+  +--------v----------+            |           |
|  |   ConcertStore     |  |    LiveStore      |            |           |
|  |   (in-memory)      |  |    (in-memory)    |            |           |
|  +--------------------+  +-------------------+            |           |
|                                                           |           |
|  +--------------------+  +-------------------+            |           |
|  | /api/health        |  | /api/error        |            |           |
|  | /api/vitals        |  | /api/track        |            |           |
|  +--------------------+  +-------------------+            |           |
+-----------------------------------------------------------------------+
                                                            |
                                                            v
                                                  +-------------------+
                                                  |  LiveKit SFU      |
                                                  |  (Cloud or self-  |
                                                  |   hosted)         |
                                                  +-------------------+

+-----------------------------------------------------------------------+
|                      BACKSTAGE DASHBOARD                              |
|                      /backstage (browser)                             |
|                                                                       |
|  +-------------+  +-------------+  +------------+  +--------------+  |
|  | Phase Ctrl  |  | Artist Mgmt |  | Audio Ctrl |  | Emergency    |  |
|  | (Maestro)   |  | (Slots)     |  | (Stream)   |  | Panel        |  |
|  +------+------+  +------+------+  +------+-----+  +------+-------+  |
|         |                |                |                |          |
|         +-------+--------+--------+-------+--------+------+          |
|                 |                                                     |
|                 v                                                     |
|         POST /api/backstage/events  (JWT-authenticated)              |
+-----------------------------------------------------------------------+
```

### Data Flow Summary

1. The **Backstage operator** sends commands (phase changes, artist entries,
   overlays, emergency actions) via authenticated POST to `/api/backstage/events`.
2. **ConcertStore** applies commands to its in-memory state and broadcasts to all
   SSE subscribers.
3. Each **viewer browser** holds an EventSource connection to
   `/api/backstage/events` (concert state) and `/api/chat` (chat messages).
4. The client-side `useConcertEvents` hook receives commands and applies them to
   local React state via `applyCmd`, which drives the 3D scene and overlays.
5. Chat messages flow through `/api/chat` POST -> LiveStore -> SSE broadcast.
6. Voice communication bypasses the Next.js server entirely, connecting
   directly to a **LiveKit SFU** via WebSocket using tokens issued by
   `/api/livekit-token`.

---

## System Descriptions

### 1. Real-Time Layer (SSE)

Two independent SSE streams provide real-time updates:

| Endpoint                  | Store        | Purpose                                    |
| ------------------------- | ------------ | ------------------------------------------ |
| `/api/backstage/events`   | ConcertStore | Concert phase, artist state, overlays, pause |
| `/api/chat`               | LiveStore    | Chat messages, reactions, viewer count       |

Both endpoints return `text/event-stream` responses with `Cache-Control: no-cache`
and `X-Accel-Buffering: no` headers. Vercel's `vercel.json` sets `maxDuration: 300`
(5 minutes) on both functions, after which the client reconnects automatically.

**Concert events SSE** sends an initial `PHASE_CHANGE` with `init: true` containing
the full `ConcertState` snapshot so late joiners synchronize immediately.

**Chat SSE** sends an `init` event with the last 50 messages and current viewer count
on connection.

**Reconnection**: `useConcertEvents` uses exponential backoff (1s -> 2s -> 4s -> ...
-> 30s cap). `useLiveChat` reconnects after a fixed 3-second delay. The service
worker explicitly passes SSE endpoints through without interception.

**Keep-alive**: The backstage events stream sends a `: ping` comment every 20 seconds
to prevent proxy timeouts.

### 2. 3D Renderer (Three.js Tiers)

The 3D scene is rendered by `MoonScene`, loaded via `next/dynamic` with `ssr: false`
to avoid server-side WebGL issues. It uses `@react-three/fiber` (R3F) v9 with
`@react-three/drei` for helpers and `@react-three/postprocessing` for cinematic
effects.

**Rendering tiers** are determined by user-agent detection (mobile vs. desktop):

| Feature               | Desktop (HIGH)         | Mobile (LOW/MID)         |
| --------------------- | ---------------------- | ------------------------ |
| DPR range             | [1, 2]                 | [1, 1.5]                |
| Shadows               | PCFSoftShadowMap       | Disabled                 |
| Antialiasing          | Enabled                | Disabled                 |
| Star count            | 8000                   | 3000                     |
| Sparkle layers        | 3 (cyan, magenta, gold)| 1 (cyan only, 120 count) |
| Post-processing       | Full (N8AO, Bloom,     | Lite (Bloom, Vignette,   |
|                       | DoF, ChromAb, Vignette,|  ToneMapping)            |
|                       | ToneMapping)           |                          |

A separate `device-profile.ts` module provides deeper device classification using
WebGL renderer strings, `navigator.deviceMemory`, Network Information API, and
user preference media queries. It computes a weighted score (GPU 3x, memory 2x,
connection 1x) to produce a final `HIGH`/`MID`/`LOW` tier.

All geometry is procedural -- the moon, stage, DJ booth, avatars, and laser systems
are built from Three.js primitives (`sphereGeometry`, `boxGeometry`, `torusGeometry`,
etc.) with `meshStandardMaterial` and `meshBasicMaterial` shaders. No external 3D
model files or texture images are loaded.

### 3. Audio Pipeline

Audio flows through three independent channels:

- **Stream audio**: The backstage operator provides an Icecast/HLS/MP3 URL via the
  Audio tab. The backstage client creates an `AudioContext`, pipes the `<audio>`
  element through a `MediaElementSource` -> `AnalyserNode` -> `destination`, and
  dispatches `AUDIO_SOURCE` commands to notify viewers.

- **LiveKit voice**: The `VoiceRoom` component connects to a LiveKit SFU for
  real-time voice chat. Token issuance (`/api/livekit-token`) uses `livekit-server-sdk`
  with host-level permissions (publish, admin) or guest-level (subscribe only). Falls
  back gracefully to a demo UI when LiveKit credentials are absent.

- **Interval/overlay audio**: Not streamed; managed via the emergency panel overlay
  system for "technical hold" or "interval" scenarios.

Audio modes tracked in ConcertState: `microphone`, `stream`, `file`, `silence`.

### 4. State Management

**ConcertStore** (`src/lib/concert-store.ts`):
- Singleton attached to `globalThis` to survive hot reloads.
- Manages concert phase, artist slots (12 slots, 3 pre-configured), audio mode,
  overlay state, pause state, and a capped command log (last 100 entries).
- Tracks analytics: `activeViewers`, `viewerPeak`, `messagesTotal`,
  `reactionsTotal`, `ctaClicks`.
- Rate limiting: 60 commands per minute per identity (sliding window).
- All mutations flow through `dispatch(type, payload, emittedBy)` which applies
  the command locally and broadcasts to SSE subscribers.

**LiveStore** (`src/lib/live-store.ts`):
- Singleton managing chat messages (capped at 200) and reactions (capped at 500).
- Viewer count derived from active SSE subscriber count + 1.
- Pub/sub model: `subscribe()` returns an unsubscribe function; `broadcast()`
  fans out to all listeners.

**Client-side state**:
- `useConcertEvents` hook maintains a local `ConcertState` replica, updated by
  applying incoming SSE commands via `applyCmd()`.
- `useLiveChat` hook maintains local message array (capped at 100 client-side)
  and viewer count.
- `page.tsx` holds UI state (loading, concert phase, modals) and syncs phase
  from the concert events SSE. Falls back to timer-based auto-progression when
  not connected to backstage.

### 5. Authentication (JWT)

The backstage dashboard uses password-based authentication:

1. Operator submits password to `POST /api/backstage/auth`.
2. Server compares against `BACKSTAGE_PASSWORD` env var (default: `backstage2024`).
3. On success, signs an HS256 JWT with `{ role: "host" }`, 8-hour expiry, using
   `BACKSTAGE_JWT_SECRET` env var.
4. Token is set as `bs_token` httpOnly cookie (`secure` in production, `sameSite: lax`).
5. All backstage API endpoints (`/api/backstage/events` POST, `/api/backstage/analytics`,
   `/api/error` GET, `/api/vitals` GET) verify the JWT before responding.

Logout calls `DELETE /api/backstage/auth` which clears the cookie.

The `/api/track` GET endpoint uses a separate `x-admin-secret` header check against
`BACKSTAGE_PASSWORD`.

### 6. Device Profiling

`device-profile.ts` runs entirely client-side and is cached after first invocation:

1. **GPU detection**: Creates a throwaway WebGL context, reads `WEBGL_debug_renderer_info`
   extension for the unmasked renderer string. Classifies against known GPU pattern
   lists (LOW: Mali-4, Adreno 3/4, SwiftShader; MID: Adreno 5-7, Intel Iris;
   HIGH: NVIDIA, GeForce, Radeon RX).
2. **Memory detection**: Reads `navigator.deviceMemory` (<4GB = LOW, 4-8GB = MID,
   >8GB = HIGH).
3. **Connection detection**: Reads Network Information API (`effectiveType`, `downlink`,
   `saveData`).
4. **Screen detection**: `devicePixelRatio`, viewport dimensions, touch capability.
5. **Preference detection**: `prefers-reduced-motion`, `prefers-color-scheme`,
   `prefers-reduced-data`.

The overall tier is computed as a weighted average with caps:
- `saveData` or `slow-2g`/`2g` caps at MID.
- `3g` caps at MID.
- `prefers-reduced-motion` caps at MID.

### 7. Service Worker (Offline Resilience)

`public/sw.js` implements a multi-strategy caching layer:

| Request Type      | Strategy              | Details                          |
| ----------------- | --------------------- | -------------------------------- |
| SSE endpoints     | Pass-through          | Never intercepted                |
| API requests      | Network only          | Never cached                     |
| Navigation        | Network first         | Falls back to cache, then /offline |
| Static assets     | Stale-while-revalidate| Serves cached, updates in background |
| Everything else   | Network first         | Falls back to cache              |

Dynamic cache is capped at 50 entries (FIFO eviction via `trimCache`). Two cache
buckets: `dua-metaverso-v1` (pre-cached critical assets) and `dua-metaverso-dynamic-v1`
(runtime cache).

### 8. Observability

| Endpoint       | Purpose                                              |
| -------------- | ---------------------------------------------------- |
| `/api/health`  | System status, SSE/concert subsystem state, memory   |
| `/api/error`   | Client error collection (deduplicated, FIFO 100)     |
| `/api/vitals`  | Web Vitals aggregation (LCP, FID, CLS, FCP, TTFB, INP) with p50/p75/p95 |
| `/api/track`   | Generic event tracking (FIFO 1000, count aggregation)|

All observability stores are in-memory and reset on cold start.

---

## Key Architectural Decisions

### SSE over WebSocket

Server-Sent Events were chosen over WebSockets for the real-time layer because:

- **Simplicity**: SSE is a native browser API (`EventSource`) with automatic
  reconnection. No handshake upgrade negotiation, no ping/pong framing, no library
  required on the client.
- **Proxy compatibility**: SSE works over standard HTTP/1.1 and HTTP/2 without
  special proxy configuration. WebSockets require `Upgrade` header support which
  some corporate firewalls and CDN configurations strip or block.
- **Sufficient for this use case**: The communication pattern is server-to-client
  broadcast (concert state, chat messages). The only client-to-server paths are
  REST POSTs (chat messages, backstage commands), which do not require a persistent
  bidirectional channel.
- **Serverless compatibility**: Vercel serverless functions support streaming
  responses natively. WebSocket support on serverless platforms requires additional
  infrastructure (API Gateway WebSocket APIs, dedicated servers, etc.).

### In-Memory Stores over External Database

Both `ConcertStore` and `LiveStore` are in-memory JavaScript singletons:

- **Cold start acceptability**: This is an event-based product. Concerts are
  scheduled, ephemeral events. Losing state on a cold start before the event begins
  is acceptable -- the backstage operator simply re-sets the phase. During a live
  event, Vercel keeps the function warm due to continuous SSE connections.
- **Zero-dependency deployment**: No Redis, no database, no connection pooling.
  The application deploys as a single `next build` with zero external service
  dependencies beyond Vercel itself (and optionally LiveKit).
- **Latency**: In-memory reads and writes are sub-microsecond. No network round-trip
  to a database for every chat message or command broadcast.
- **Upgrade path**: Both stores are isolated behind clean class interfaces.
  `LiveStore` includes a comment noting the Redis upgrade path. Swapping to Redis
  or PostgreSQL requires implementing the same `subscribe`/`broadcast`/`addMessage`
  interface with a pub/sub adapter -- the rest of the codebase does not change.

### Tiered Rendering over Single-Quality

The 3D renderer adapts quality based on device capability rather than offering a
single "best effort" experience:

- **Cross-device reach without exclusion**: LOW-tier devices get a visually coherent
  experience (stars, bloom, stage) without the post-processing and particle density
  that would cause frame drops. HIGH-tier devices get the full cinematic pipeline
  (N8AO ambient occlusion, depth of field, chromatic aberration).
- **Predictable performance**: Each tier has a known performance profile. This is
  preferable to a single renderer that may or may not hit 60fps depending on the
  device, which leads to an unpredictable user experience.
- **No runtime quality toggle complexity**: The tier is determined once at scene mount.
  There is no dynamic quality adjustment during the concert, avoiding visual
  discontinuities or jank during transitions.

### Procedural Shaders over Texture Files

All 3D scene geometry uses procedural construction and material parameters rather
than loaded texture files or GLTF models:

- **Zero network cost for 3D assets**: The entire 3D scene -- moon, stage, DJ booth,
  avatars, lasers, particles -- is generated from code. There are no `.glb`, `.gltf`,
  `.png`, or `.jpg` assets to download. This eliminates 3D asset bandwidth entirely.
- **Instant cold cache loading**: First-time visitors get the same load performance
  as repeat visitors. No texture download waterfall, no model parsing latency.
- **Bundle co-location**: The 3D scene logic ships inside the JavaScript bundle,
  which is already optimized by Next.js code splitting and Vercel CDN caching
  (`max-age=31536000, immutable` for `/_next/static/`).
- **Artistic control**: Colors, emissive intensities, and material properties are
  parameters in code, making them trivially adjustable per concert phase without
  re-exporting assets from a 3D modeling tool.

### Progressive Enhancement over Graceful Degradation

The application builds up from a minimal base rather than stripping down from a
maximal experience:

- **Loading screen**: The base experience is a styled loading screen. The 3D scene,
  chat, and voice room mount progressively after the initial render.
- **Guest system**: Users see the 3D scene before joining. Joining adds chat and
  voice capabilities. The core visual experience does not require authentication.
- **LiveKit fallback**: Voice room has three tiers: LiveKit Cloud (real-time voice),
  Demo mode (mock UI), and Disconnected (reconnect prompt). Each tier is a
  complete experience, not a broken version of a higher tier.
- **SSE fallback**: When the backstage SSE connection is unavailable, the concert
  auto-progresses through phases on a timer. Viewers get a complete concert
  experience even if the backstage operator is not connected.
- **Service worker**: Offline visitors see a cached version of the last loaded page
  rather than a browser error. SSE endpoints gracefully fail and reconnect.

---

## Environment Variables

| Variable               | Required | Default                          | Purpose                     |
| ---------------------- | -------- | -------------------------------- | --------------------------- |
| `BACKSTAGE_PASSWORD`   | No       | `backstage2024`                  | Backstage login password    |
| `BACKSTAGE_JWT_SECRET` | Yes*     | `change-me-in-production-32chars!!` | JWT signing key (change in prod) |
| `LIVEKIT_API_KEY`      | No       | --                               | LiveKit Cloud API key       |
| `LIVEKIT_API_SECRET`   | No       | --                               | LiveKit Cloud API secret    |
| `LIVEKIT_URL`          | No       | --                               | LiveKit WebSocket URL       |

*Using the default JWT secret in production is a security risk.

---

## Concert Phases

| Phase                  | Duration (auto-mode) | Description                     |
| ---------------------- | -------------------- | ------------------------------- |
| `opening`              | 18s                  | Welcome, moon scene, ambient    |
| `dua2_presentation`    | 25s                  | DUA 2.0 product presentation    |
| `vado_performance`     | 18s                  | VADO MKA artist performance     |
| `uzzy_performance`     | 18s                  | UZZY artist performance         |
| `estraca_performance`  | 18s                  | ESTRACA artist performance      |
| `finale`               | Infinite             | All artists, closing            |

In backstage-connected mode, phase transitions are triggered manually by the host.
The auto-timer durations above are fallback values used only when the backstage
SSE connection is not established.

---

## API Endpoint Summary

| Method | Endpoint                    | Auth     | Purpose                              |
| ------ | --------------------------- | -------- | ------------------------------------ |
| GET    | `/api/backstage/events`     | None     | SSE stream of concert commands       |
| POST   | `/api/backstage/events`     | JWT      | Dispatch concert command             |
| POST   | `/api/backstage/auth`       | Password | Login, receive JWT cookie            |
| DELETE | `/api/backstage/auth`       | None     | Logout, clear cookie                 |
| GET    | `/api/backstage/analytics`  | JWT      | Live analytics snapshot              |
| GET    | `/api/chat`                 | None     | SSE stream of chat + reactions       |
| POST   | `/api/chat`                 | None     | Send chat message                    |
| POST   | `/api/reactions`            | None     | Send reaction emoji                  |
| GET    | `/api/livekit-token`        | None     | Get LiveKit room token               |
| GET    | `/api/health`               | None     | System health check                  |
| GET    | `/api/error`                | JWT      | View collected client errors         |
| POST   | `/api/error`                | None     | Report client error                  |
| GET    | `/api/vitals`               | JWT      | View Web Vitals aggregation          |
| POST   | `/api/vitals`               | None     | Report Web Vital metric              |
| GET    | `/api/track`                | Secret   | View tracked events                  |
| POST   | `/api/track`                | None     | Track a generic event                |

---

## Deployment

- **Platform**: Vercel (region: `cdg1` -- Paris)
- **Runtime**: Node.js (all API routes specify `runtime = "nodejs"`)
- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, and Permissions-Policy set via `vercel.json`
- **Caching**: Static assets (`/_next/static/*`) set to `max-age=31536000, immutable`
- **SSE buffering**: Disabled via `X-Accel-Buffering: no` header on streaming endpoints
