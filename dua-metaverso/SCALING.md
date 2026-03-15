# DUA Metaverso -- Scaling Guide

This document analyzes the current capacity of the DUA Metaverso platform and
provides a scaling roadmap from the current single-instance architecture to
10,000+ concurrent viewers.

---

## Table of Contents

1. [Current Capacity Analysis](#1-current-capacity-analysis)
2. [Scaling to 1,000 Concurrent Viewers](#2-scaling-to-1000-concurrent-viewers)
3. [Scaling to 10,000+ Concurrent Viewers](#3-scaling-to-10000-concurrent-viewers)
4. [Ordered Recommendations by Impact](#4-ordered-recommendations-by-impact)

---

## 1. Current Capacity Analysis

### Architecture Constraints

The current deployment runs as a single Vercel serverless function (Node.js
runtime, region `cdg1`). The key constraints are:

```
+---------------------------------------------------+
|          CURRENT ARCHITECTURE LIMITS               |
|                                                    |
|  Vercel Serverless Function (single instance)      |
|  +----------------------------------------------+  |
|  |  ConcertStore (in-memory)                    |  |
|  |  LiveStore (in-memory)                       |  |
|  |  Error log (in-memory, 100 entries max)      |  |
|  |  Vitals store (in-memory, 200/metric max)    |  |
|  |  Track events (in-memory, 1000 events max)   |  |
|  +----------------------------------------------+  |
|                                                    |
|  SSE connections: limited by function timeout      |
|  Function timeout: 300s (vercel.json maxDuration)  |
|  Memory: ~256 MB (Vercel default)                  |
+---------------------------------------------------+
```

### Connection Limits

**SSE function timeout**: Each SSE connection (`/api/backstage/events` and
`/api/chat`) lives for at most 300 seconds before Vercel terminates the function
execution. Clients reconnect automatically, but during the reconnection window
(1-30 seconds) new events are buffered server-side and delivered as an initial
state snapshot on reconnection.

**Concurrent connections**: Vercel does not publish hard limits on concurrent
streaming responses from a single function, but practical limits exist:
- Each SSE subscriber holds a `ReadableStream` with an `enqueue` callback
- Memory per subscriber: ~0.5-1 MB (stream buffer + closure references)
- At 256 MB function memory, practical limit: **100-150 concurrent SSE connections**

**Single-instance bottleneck**: Because `ConcertStore` and `LiveStore` are
in-memory singletons, all viewers must connect to the same function instance.
Vercel may route requests to different instances under load, causing state
divergence (some viewers see different concert phases or missing chat messages).

### Estimated Current Capacity

| Metric                    | Limit                | Notes                           |
| ------------------------- | -------------------- | ------------------------------- |
| Concurrent SSE viewers    | ~100-150             | Memory-bound                    |
| Chat throughput           | ~200 msgs/min        | In-memory broadcast, no I/O     |
| Concert commands          | 60/min (rate limited)| Per-identity sliding window     |
| State persistence         | None                 | Lost on cold start              |
| Multi-instance support    | No                   | In-memory stores are per-instance|
| Function timeout          | 300s                 | Clients reconnect automatically |

### Cost at Current Scale

- **Vercel Hobby**: $0/mo (100 GB bandwidth, 100 GB-hours serverless)
- **LiveKit**: Free tier or $0 if demo mode
- **Total**: $0/mo for small events (<50 viewers)

---

## 2. Scaling to 1,000 Concurrent Viewers

### 2.1 Move to Redis for Chat and Concert State

**Problem**: In-memory stores cannot be shared across function instances. Under
load, Vercel spawns multiple instances, each with its own copy of state.

**Solution**: Replace `LiveStore` and `ConcertStore` with Redis-backed
implementations using a service like Upstash (serverless Redis with HTTP API).

```
BEFORE (single instance):
+----------+     +----------+
| Instance |     | Instance |  <-- State divergence!
| Store A  |     | Store B  |
+----------+     +----------+

AFTER (Redis):
+----------+     +----------+
| Instance |     | Instance |  <-- Both read/write same state
+-----+----+     +----+-----+
      |               |
      v               v
  +------------------------+
  |  Redis (Upstash)       |
  |  - Concert state       |
  |  - Chat messages       |
  |  - Viewer tracking     |
  |  - Pub/Sub channels    |
  +------------------------+
```

Implementation approach:
- Use Upstash Redis with the `@upstash/redis` HTTP client (no persistent TCP
  connections needed in serverless)
- Use Redis Pub/Sub for real-time broadcast: when a message is added, publish
  to a channel; each SSE function subscribes to the channel and relays to its
  connected clients
- Use Redis Lists for message history (capped at 200 with `LTRIM`)
- Use Redis Hash for concert state (single key, atomic updates)
- Use Redis `INCR` for viewer counting

**Impact**: HIGH -- Eliminates the single-instance bottleneck. All function
instances share the same state.

**Effort**: MEDIUM -- Both stores have clean interfaces (`subscribe`, `broadcast`,
`addMessage`, `dispatch`). The replacement implements the same interface backed
by Redis operations. `LiveStore` already has a comment noting this upgrade path.

**Estimated time**: 2-3 days for implementation + testing.

### 2.2 Use Vercel Edge Runtime for SSE Endpoints

**Problem**: Node.js serverless functions on Vercel have a 300-second timeout
and higher cold start latency.

**Solution**: Migrate the SSE endpoints (`/api/backstage/events` GET and
`/api/chat` GET) to Vercel Edge Runtime.

Benefits:
- **No cold starts**: Edge functions are always warm
- **Longer connections**: Edge functions support streaming with higher timeout
  tolerance
- **Lower latency**: Runs closer to the user (Vercel Edge Network)
- **Higher concurrency**: Edge functions handle more simultaneous connections

Implementation:
- Change `export const runtime = "nodejs"` to `export const runtime = "edge"`
  on SSE route handlers
- Replace Node.js-specific APIs (if any) with Web API equivalents
- Ensure Redis client works in Edge Runtime (Upstash HTTP client is Edge-compatible)

**Note**: POST endpoints for commands and authentication should remain on Node.js
runtime for access to the `jose` JWT library and `crypto` module.

**Impact**: MEDIUM -- Reduces reconnection frequency, improves connection stability.

**Effort**: MEDIUM -- Requires Edge-compatible Redis client and testing.

### 2.3 CDN for Static Assets

**Status**: Already handled by Vercel. `vercel.json` sets:

```json
{
  "source": "/_next/static/(.*)",
  "headers": [
    { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
  ]
}
```

Next.js static assets are automatically served through Vercel's CDN with content
hashing. No additional CDN configuration is needed at this scale.

### 2.4 Estimated Costs at 1,000 Viewers

| Service         | Tier         | Monthly Cost | Notes                         |
| --------------- | ------------ | ------------ | ----------------------------- |
| Vercel          | Pro          | $20          | Higher limits, 1 TB bandwidth |
| Upstash Redis   | Pay-as-you-go| $10-20       | ~100K commands/day            |
| LiveKit Cloud   | Starter      | $0-50        | Based on participant-minutes  |
| **Total**       |              | **$30-90**   |                               |

---

## 3. Scaling to 10,000+ Concurrent Viewers

### 3.1 Dedicated SSE Infrastructure

**Problem**: At 10,000+ viewers, even Edge-based SSE streams create significant
connection management overhead. Each viewer holds two persistent connections
(concert events + chat), totaling 20,000+ concurrent streams.

**Solution**: Move real-time delivery to a dedicated infrastructure:

```
+-----------------------------------------------------------------------+
|  Option A: Socket.io with Redis Adapter                               |
|                                                                       |
|  +----------+  +----------+  +----------+                             |
|  | Socket.io|  | Socket.io|  | Socket.io|  <-- Horizontally scaled   |
|  | Server 1 |  | Server 2 |  | Server 3 |                             |
|  +-----+----+  +-----+----+  +-----+----+                             |
|        |              |              |                                 |
|        v              v              v                                 |
|  +------------------------------------------+                         |
|  |  Redis Pub/Sub (adapter)                  |                         |
|  +------------------------------------------+                         |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
|  Option B: Managed Service (Ably, Pusher, or similar)                 |
|                                                                       |
|  Next.js API  -->  Publish to channel  -->  Managed service fans out  |
|                                              to 10K+ subscribers      |
+-----------------------------------------------------------------------+
```

Option A (Socket.io + Redis adapter):
- Deploy 3-5 Socket.io server instances behind a load balancer
- Use `@socket.io/redis-adapter` for cross-instance message delivery
- Clients connect via WebSocket (Socket.io handles fallback to long-polling)
- The Next.js API publishes events to Redis; Socket.io servers relay to clients

Option B (Managed real-time service):
- Use Ably, Pusher, or similar for fan-out
- Next.js API publishes to the service via REST API
- Clients subscribe via the service's client SDK
- Eliminates connection management entirely from the application

**Impact**: HIGHEST capacity -- Designed for 100K+ concurrent connections.

**Effort**: HIGH -- Requires new client-side connection logic, server infrastructure,
and deployment pipeline.

### 3.2 LiveKit SFU Capacity

LiveKit is already integrated for voice rooms. Scaling voice to 10,000+ viewers:

- **Viewers (listen-only)**: LiveKit SFU handles this well. Most viewers are
  subscribers, not publishers. A single LiveKit SFU node can support thousands
  of subscriber connections.
- **Active speakers**: Limited by the SFU's mixing capacity. For a concert
  scenario, only 1-5 participants publish audio (host + artists). This is
  well within a single SFU node's capacity.
- **LiveKit Cloud**: Automatically scales. No infrastructure management needed.
  Pricing based on participant-minutes.

If self-hosting LiveKit:
- Deploy multiple SFU nodes with a Redis-backed room directory
- Use LiveKit's built-in horizontal scaling (rooms are sharded across nodes)
- Estimated: 1 SFU node per 500 participants (with 1-5 publishers)

### 3.3 CDN Optimization and Bundle Splitting

At 10,000+ viewers, bandwidth costs become significant. Optimize:

**Bundle analysis**:
- Current `three` import is ~600 KB minified. Use tree-shaking and dynamic
  imports to load only needed modules.
- `@livekit/components-react` is already lazy-loaded in `VoiceRoom`.
- `canvas-confetti` is small (~7 KB) but only needed on phase transitions.

**Aggressive caching strategy**:
```
/_next/static/*   --> immutable, 1 year (already configured)
/sw.js            --> no-cache (must always be fresh)
/api/*            --> no-cache (dynamic)
/*.html           --> stale-while-revalidate, 60s
```

**Image and font optimization**:
- Currently no external images (procedural 3D). This is already optimal.
- Google Fonts (`Orbitron`, `Montserrat`) could be self-hosted to eliminate
  the external dependency and reduce DNS lookups.

**Code splitting targets**:
- `MoonScene` is already dynamically imported (`next/dynamic`)
- Split backstage dashboard into its own chunk (it is a separate route)
- Lazy-load `MusicModal`, `ConversionModal` (only needed on interaction)

### 3.4 Database for Persistence

At this scale, in-memory stores (even Redis-backed) should be supplemented with
durable storage for analytics and audit:

- **PostgreSQL** (Vercel Postgres or Neon): Store event logs, chat history,
  vitals data, and error reports persistently
- **Read path**: Backstage analytics queries go to PostgreSQL
- **Write path**: Hot data goes to Redis (real-time), background jobs flush
  to PostgreSQL

### 3.5 Estimated Costs at 10,000+ Viewers

| Service                | Tier         | Monthly Cost   | Notes                          |
| ---------------------- | ------------ | -------------- | ------------------------------ |
| Vercel                 | Pro/Enterprise| $20-400       | Bandwidth-dependent            |
| Redis (Upstash)        | Pro          | $50-100        | Higher throughput tier          |
| Dedicated SSE infra    | --           | $50-200        | 3-5 instances on Fly.io/Railway|
| OR Managed RT service  | --           | $100-300       | Ably/Pusher pricing            |
| LiveKit Cloud          | Growth       | $50-150        | Based on participant-minutes   |
| PostgreSQL             | Hobby/Pro    | $0-50          | Neon free tier or Vercel Postgres|
| **Total**              |              | **$200-500**   |                                |

---

## 4. Ordered Recommendations by Impact

### Priority 1: Redis for State Persistence

**Impact**: Highest
**Effort**: Low-Medium
**Cost**: ~$10-20/mo

This is the single most impactful change. It solves:
- State divergence across function instances
- State loss on cold starts
- Viewer count accuracy (currently per-instance)
- Chat message consistency (all instances see all messages)

Implementation sketch:

```typescript
// Replace in-memory LiveStore with Redis-backed version
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

class RedisLiveStore {
  async addMessage(msg: Omit<ChatMessage, "id" | "timestamp">) {
    const message = { ...msg, id: `msg-${Date.now()}`, timestamp: Date.now() };
    await redis.lpush("chat:messages", JSON.stringify(message));
    await redis.ltrim("chat:messages", 0, 199);
    await redis.publish("chat:new", JSON.stringify(message));
    return message;
  }

  async getMessages(limit = 50) {
    const raw = await redis.lrange("chat:messages", 0, limit - 1);
    return raw.map(r => JSON.parse(r)).reverse();
  }
}
```

The same pattern applies to ConcertStore: store state in a Redis Hash, publish
commands to a Redis Pub/Sub channel, subscribe in SSE handlers.

### Priority 2: Edge SSE Handlers

**Impact**: Medium
**Effort**: Medium
**Cost**: $0 (included in Vercel Pro)

Move SSE GET handlers to Edge Runtime for:
- Zero cold start latency
- Better connection stability
- Higher concurrent connection capacity
- Global edge distribution (lower latency for non-European viewers)

Prerequisites:
- Priority 1 (Redis) must be completed first -- Edge functions cannot hold
  in-memory state across invocations
- Must use Upstash Redis HTTP client (Edge-compatible)

### Priority 3: Bundle Optimization and Aggressive Caching

**Impact**: Medium
**Effort**: Low
**Cost**: $0

Quick wins for all scale tiers:

1. **Analyze bundle**: Run `next build --analyze` (add `@next/bundle-analyzer`)
   to identify oversized chunks
2. **Lazy-load modals**: `MusicModal` and `ConversionModal` are imported
   statically in `page.tsx`. Convert to `next/dynamic` with `ssr: false`
3. **Self-host fonts**: Download Orbitron and Montserrat, serve from
   `public/fonts/` with immutable caching
4. **Tree-shake Three.js**: Import only used components from `three` rather
   than `import * as THREE from "three"`
5. **Service worker cache versioning**: Bump `CACHE_NAME` version on each
   deploy (currently hardcoded as `dua-metaverso-v1`)

Estimated bundle reduction: 15-25% (primarily from Three.js tree-shaking).

### Priority 4: Dedicated Real-Time Infrastructure

**Impact**: Highest capacity
**Effort**: High
**Cost**: $100-300/mo

Only necessary when approaching 1,000+ concurrent viewers and SSE reconnection
frequency becomes a user experience issue. This is the path to 10,000+.

Decision matrix:

| Factor                 | Socket.io + Redis    | Managed Service (Ably/Pusher) |
| ---------------------- | -------------------- | ----------------------------- |
| Control                | Full                 | Limited                       |
| Ops burden             | Medium (manage nodes)| None                          |
| Cost at 10K viewers    | $50-200/mo           | $100-300/mo                   |
| Latency                | Low (self-managed)   | Low (global edge)             |
| Implementation time    | 1-2 weeks            | 2-3 days                      |
| Vendor lock-in         | None                 | Medium                        |

---

## Scaling Summary

```
Viewers    Architecture                  Monthly Cost    Key Change
--------   ---------------------------   ------------    --------------------------
< 100      Current (in-memory, SSE)      $0              None needed
100-500    + Redis state                  $30-50          Priority 1
500-1000   + Edge SSE + bundle opt        $50-90          Priority 2 + 3
1000-5000  + Dedicated RT infrastructure  $150-300        Priority 4
5000+      + Managed RT + scaled SFU      $300-500+       Enterprise considerations
```
