# DUA Metaverso -- Operational Runbook

This document covers operational procedures for running a live concert event
on the DUA Metaverso platform. It is intended for the technical operator
managing the backstage dashboard during a show.

---

## Table of Contents

1. [Pre-Event Checklist (T-2 hours)](#1-pre-event-checklist-t-2-hours)
2. [During the Event](#2-during-the-event)
3. [Post-Event Procedures](#3-post-event-procedures)
4. [Emergency Procedures](#4-emergency-procedures)
5. [Interpreting Metrics](#5-interpreting-metrics)

---

## 1. Pre-Event Checklist (T-2 hours)

### 1.1 Environment Variables

Verify all required environment variables are set in the Vercel project settings:

```
BACKSTAGE_PASSWORD      -- Must NOT be the default "backstage2024"
BACKSTAGE_JWT_SECRET    -- Must NOT be the default. Use a random 32+ char string.
LIVEKIT_API_KEY         -- Required if voice rooms are active
LIVEKIT_API_SECRET      -- Required if voice rooms are active
LIVEKIT_URL             -- Required if voice rooms are active (wss:// URL)
```

If LiveKit variables are unset, voice rooms will operate in demo mode (mock UI,
no real audio). This is acceptable for events that do not use voice interaction.

### 1.2 Verify Health Endpoint

```bash
curl -s https://YOUR_DOMAIN/api/health | jq .
```

Expected response:

```json
{
  "status": "ok",
  "uptime": 120,
  "version": "1.0.0",
  "subsystems": {
    "sse": { "status": "inactive", "subscribers": 0 },
    "concert": { "status": "inactive", "phase": "opening", "viewers": 0 },
    "lastEvent": null
  },
  "memory": { "heapUsed": 25.5, "heapTotal": 40.0, "rss": 80.0 }
}
```

Verify:
- `status` is `"ok"` (not `"degraded"`)
- `subsystems.concert.phase` is `"opening"` (clean initial state)
- `memory.heapUsed` is below 100 MB

If the health endpoint is unreachable, the deployment may have failed. Check
Vercel deployment logs.

### 1.3 Test Backstage Login

1. Navigate to `https://YOUR_DOMAIN/backstage/login`
2. Enter the `BACKSTAGE_PASSWORD`
3. Verify you are redirected to the backstage dashboard
4. Confirm the header shows "ONLINE" (SSE connected)

If login fails with 401, double-check the `BACKSTAGE_PASSWORD` env var in Vercel.

### 1.4 Test All 6 Phases Manually

In the backstage dashboard Maestro tab, click through each phase. Each requires
a double-click (first click shows "CONFIRMAR?", second click confirms):

1. **ABERTURA** (opening) -- Default start state
2. **DUA 2.0** (dua2_presentation) -- DUA 2.0 holographic screen appears
3. **VADO MKA** (vado_performance) -- Vado avatar enters from left
4. **UZZY** (uzzy_performance) -- Uzzy avatar enters from right
5. **ESTRACA** (estraca_performance) -- Estraca avatar enters from left
6. **FINALE** -- All artists visible, infinite duration

For each phase, open the concert view (`https://YOUR_DOMAIN/`) in a separate
tab and verify:
- The 3D scene updates (lighting, avatars appear/disappear)
- Confetti fires on phase transitions
- The conversion modal appears when leaving performance phases

After testing, reset to "ABERTURA" phase before the event.

### 1.5 Verify Audio Stream URL

If using an external audio stream (Icecast, HLS, MP3):

1. Go to the Audio tab in backstage
2. Enter the stream URL
3. Click "LIGAR" (connect)
4. Verify the audio level meter shows activity
5. Click "STOP" to disconnect
6. Note the URL for use during the live event

Common stream URL formats:
- Icecast: `http://YOUR_SERVER:8000/stream.mp3`
- HLS: `https://YOUR_CDN/live/stream.m3u8`
- Direct MP3: `https://YOUR_HOST/audio.mp3`

### 1.6 Check Monitoring

Open these endpoints in a monitoring dashboard or bookmark them:

| URL                             | Purpose               | Check interval |
| ------------------------------- | --------------------- | -------------- |
| `/api/health`                   | System health         | 30s            |
| `/backstage` (Analytics bar)    | Live viewer count     | Continuous     |
| `/api/error` (via backstage)    | Client error log      | 5 min          |
| `/api/vitals` (via backstage)   | Web Vitals            | 15 min         |

---

## 2. During the Event

### 2.1 Monitor Health

Keep `/api/health` polling active. Watch for:

- `status: "degraded"` -- Indicates `isPaused` is true (emergency pause active)
- `memory.heapUsed` > 200 MB -- Possible memory pressure from many SSE subscribers
- `subsystems.sse.subscribers` -- Should roughly match expected viewer count
- `subsystems.concert.viewers` -- Active viewer count tracked by ConcertStore

### 2.2 Monitor Backstage Dashboard

The backstage header displays live metrics:

- **ESPECT.** (viewers): Active SSE connections
- **PICO** (peak): Highest simultaneous viewer count
- **MSGS** (messages): Total chat messages sent
- **CTA**: Number of conversion modal triggers
- **CONV**: Conversion rate (CTA clicks / active viewers)
- **Phase duration**: Time elapsed in current phase

### 2.3 Common Failure Scenarios

#### Audio Dropout

**Symptoms**: Audio level meter drops to 0%, viewers report no sound.

**Resolution**:
1. Click "STOP" in the Audio tab
2. Verify the stream URL is still accessible (open in a new tab)
3. If the URL is down, switch to the fallback URL
4. Click "LIGAR" with the new/same URL
5. If audio still fails, use the emergency "MUSICA DE INTERVALO" button and
   troubleshoot the stream source offline

#### SSE Disconnect

**Symptoms**: Backstage header shows "OFFLINE", viewer count drops.

**Resolution**:
- Client-side reconnection is automatic. `useConcertEvents` uses exponential
  backoff (1s to 30s). `useLiveChat` reconnects after 3 seconds.
- If the backstage dashboard itself disconnects, refresh the page. The SSE
  connection will re-establish and receive the current state snapshot.
- If disconnections are persistent, check Vercel function logs for errors.
  The 300-second `maxDuration` limit in `vercel.json` means SSE connections
  will drop every 5 minutes -- this is expected behavior and clients handle
  it transparently.

#### 3D Scene Crash

**Symptoms**: Viewer sees a black screen or frozen 3D canvas.

**Resolution**:
- Instruct viewers to reload the page. The 3D scene remounts on page load.
- If crashes are widespread, check `/api/error` for common error messages.
  Typical causes:
  - WebGL context lost (GPU memory pressure)
  - Three.js shader compilation failure on specific GPU/driver combinations
- As a last resort, the concert still functions without the 3D scene -- chat
  and audio continue to work.

#### High Error Rate

**Symptoms**: Spike in errors visible in backstage error panel.

**Resolution**:
1. Check `GET /api/error` (requires backstage JWT cookie) for error details
2. Look at the `count` field -- errors with `count > 10` indicate widespread issues
3. Check `stack` field for actionable information
4. Common patterns:
   - `Failed to fetch` -- Network issues, likely transient
   - `WebGL` errors -- GPU-related, affects specific device types
   - `SyntaxError` in SSE parsing -- Corrupt SSE frame, usually resolves on reconnect
5. If error rate exceeds 20% of viewer count, consider using the emergency
   overlay to communicate with viewers

---

## 3. Post-Event Procedures

### 3.1 Trigger Finale

1. In the Maestro tab, click **FINALE** (double-click to confirm)
2. Optionally fire a final confetti burst via the CONFETTI button
3. Optionally show an applause overlay via the APLAUSOS button
4. Send a closing message via the Chat tab broadcast

### 3.2 Wait for Viewers to Leave

Monitor the viewer count in the backstage header. Do not shut down services
while viewers are still connected. Typical drain pattern:

- 50% of viewers leave within 2 minutes of finale
- 90% leave within 10 minutes
- Remaining viewers are typically idle/background tabs

### 3.3 Check Analytics

In the backstage dashboard, note the final analytics:

- **Peak viewers**: Maximum simultaneous viewers during the event
- **Total messages**: Chat engagement metric
- **CTA clicks**: Conversion funnel top
- **Conversion rate**: CTA clicks / peak viewers

### 3.4 Export Vitals

Retrieve Web Vitals data before the serverless function goes cold (data is
in-memory and will be lost):

```bash
# Requires the bs_token cookie from an active backstage session
curl -s -b "bs_token=YOUR_JWT_TOKEN" \
  https://YOUR_DOMAIN/api/vitals | jq .
```

Save the response JSON. It contains p50, p75, and p95 percentiles for each
metric (LCP, FID, CLS, FCP, TTFB, INP).

### 3.5 Export Error Log

```bash
curl -s -b "bs_token=YOUR_JWT_TOKEN" \
  https://YOUR_DOMAIN/api/error | jq .
```

Save for post-mortem analysis. Errors include `message`, `stack`, `userAgent`,
`url`, `timestamp`, and `count` (deduplication count within 60-second windows).

### 3.6 Export Event Tracking Data

```bash
curl -s -H "x-admin-secret: YOUR_BACKSTAGE_PASSWORD" \
  https://YOUR_DOMAIN/api/track | jq .
```

Returns aggregated event counts and total tracked events.

---

## 4. Emergency Procedures

### 4.1 Emergency Pause

**When to use**: Critical technical failure that requires halting the show
(audio feedback loop, inappropriate content in chat, major rendering bug
affecting all viewers).

**Action**:
1. Go to the **EMERGENCIA** tab in backstage
2. Click **PAUSAR TUDO**
3. This sets `isPaused: true` in ConcertState, broadcast to all viewers
4. The health endpoint will report `status: "degraded"`

**To resume**:
1. Click **RETOMAR** in the emergency tab
2. ConcertState returns to normal, viewers resume

### 4.2 Interval Music Activation

**When to use**: Technical issue requires time to resolve but the event should
not appear "broken" to viewers.

**Action**:
1. In the **EMERGENCIA** tab, click **MUSICA DE INTERVALO**
2. This shows an overlay: "Intervalo -- voltamos ja!" with 120-second duration
3. If you have a backup audio stream, switch to it in the Audio tab

### 4.3 Technical Hold Overlay

**When to use**: Active troubleshooting, viewers need to know there is a
known issue being addressed.

**Action**:
1. In the **EMERGENCIA** tab, click **AGUARDA -- TECNICO**
2. Shows overlay: "A resolver problema tecnico. Aguarda..." with 60-second duration
3. Overlay auto-dismisses after 60 seconds. Re-trigger if needed.

### 4.4 Clear All Overlays

If an overlay is stuck or displaying incorrect information:
1. In the **EMERGENCIA** tab, click **LIMPAR OVERLAYS**
2. Sends `OVERLAY_HIDE` command to all viewers

### 4.5 Graceful Shutdown Sequence

For an orderly shutdown (planned or emergency):

1. Send a closing message via Chat broadcast:
   "Obrigado por fazerem parte desta noite!"
2. Click **ENCERRAR CONCERTO** in the emergency tab (triggers FINALE phase +
   closing overlay with 30-second duration)
3. Wait 2-5 minutes for viewers to disconnect naturally
4. If immediate shutdown is needed, the Vercel function will terminate on its
   own when all SSE connections close or the `maxDuration` expires

### 4.6 Decision Tree

```
Issue detected
    |
    +-- Is audio broken?
    |       |
    |       +-- Yes --> Stop stream, try fallback URL
    |       |           |
    |       |           +-- Fallback works --> Continue event
    |       |           +-- No fallback   --> Activate interval music overlay
    |       |
    |       +-- No --> Continue
    |
    +-- Are viewers reporting blank screens?
    |       |
    |       +-- < 10% of viewers --> Advise reload via chat broadcast
    |       +-- > 10% of viewers --> Technical hold overlay, check /api/error
    |       +-- > 50% of viewers --> Emergency pause, investigate immediately
    |
    +-- Is chat broken (no messages flowing)?
    |       |
    |       +-- Check /api/health SSE subscriber count
    |       +-- If subscribers = 0 --> Possible serverless cold start, wait 30s
    |       +-- If subscribers > 0 --> LiveStore may be full, messages still broadcast
    |
    +-- Is the backstage dashboard disconnected?
            |
            +-- Refresh the page
            +-- If persistent --> Check Vercel function logs
            +-- Viewers are unaffected (they have their own SSE connections)
```

---

## 5. Interpreting Metrics

### 5.1 Web Vitals Thresholds

The `/api/vitals` endpoint collects Core Web Vitals. Reference thresholds
(from web.dev):

| Metric | Good        | Needs Improvement | Poor        |
| ------ | ----------- | ----------------- | ----------- |
| LCP    | < 2500 ms   | 2500 - 4000 ms    | > 4000 ms   |
| FID    | < 100 ms    | 100 - 300 ms      | > 300 ms    |
| CLS    | < 0.1       | 0.1 - 0.25        | > 0.25      |
| FCP    | < 1800 ms   | 1800 - 3000 ms    | > 3000 ms   |
| TTFB   | < 800 ms    | 800 - 1800 ms     | > 1800 ms   |
| INP    | < 200 ms    | 200 - 500 ms      | > 500 ms    |

**Expected values for DUA Metaverso**:

- **LCP**: 2000-3500 ms is typical due to the 3D scene initialization. The Three.js
  canvas is the LCP element. p75 under 4000 ms is acceptable.
- **CLS**: Should be near 0. The layout is fixed (full-screen canvas + sidebar).
  If CLS > 0.1, investigate dynamically loaded components causing layout shifts.
- **FID/INP**: Should be < 100 ms. The React event handlers are lightweight. If
  elevated, investigate heavy re-renders caused by high-frequency SSE events.
- **FCP**: Should be < 2000 ms. The loading screen is the first contentful paint.
  If elevated, check Vercel function cold start times.
- **TTFB**: Should be < 500 ms from `cdg1` (Paris) region. If elevated beyond
  1000 ms, check Vercel function cold start or regional network issues.

### 5.2 Viewer Count Patterns

Normal viewer count behavior during an event:

```
Viewers
  ^
  |          +------+
  |         /        \        +---+
  |        /          \      /     \
  |   +---+            +----+       +---->  (finale drain)
  |  /
  | /
  +--+---+---+---+---+---+---+---+---+---> Time
     |   |       |       |       |   |
   Open  DUA2  Vado    Uzzy   Estr  Finale
```

- **Ramp-up**: Gradual increase during opening as viewers join
- **Peak**: Usually during the second or third performance
- **Dips**: Small drops between phase transitions (some viewers leave, new ones join)
- **Drain**: Gradual decline after finale begins

Warning signs:
- Sudden drop > 30% in 1 minute: Possible SSE server error or deployment issue
- Viewer count stuck at 1: SSE endpoint may not be accepting new connections
- Viewer count much higher than expected: Possible bot traffic (check `/api/error`
  for unusual user agents)

### 5.3 Reconnection Rates

SSE connections drop every 300 seconds (Vercel function timeout) and reconnect
automatically. This means:

- **Expected reconnections per viewer per hour**: ~12 (every 5 minutes)
- **Reconnection should be invisible**: The client receives a fresh state snapshot
  on each reconnection via the `init` payload
- **Abnormal**: If `/api/health` shows `subscribers: 0` during an active event
  with known viewers, the serverless function may have cold-started and lost all
  connections. Viewers will reconnect within 1-30 seconds (backoff).

### 5.4 Memory Usage

Normal ranges for the Node.js serverless function:

| Metric    | Idle        | 50 viewers  | 200 viewers |
| --------- | ----------- | ----------- | ----------- |
| heapUsed  | 20-30 MB    | 40-60 MB    | 80-120 MB   |
| rss       | 60-80 MB    | 100-150 MB  | 180-250 MB  |

Each SSE subscriber adds approximately 0.5-1 MB of memory overhead (stream
buffers, listener references). If `heapUsed` exceeds 200 MB, the function is
under memory pressure and may experience garbage collection pauses.

### 5.5 Error Rates

Normal error rate during a concert: < 2% of viewer count per 10-minute window.

| Rate       | Severity | Action                                    |
| ---------- | -------- | ----------------------------------------- |
| < 2%       | Normal   | No action needed                          |
| 2-5%       | Elevated | Monitor /api/error for patterns            |
| 5-10%      | Warning  | Investigate common error messages          |
| > 10%      | Critical | Consider emergency pause, broadcast message|

Errors are deduplicated within 60-second windows, so a `count` of 50 on a
single error message indicates 50 unique occurrences, not 50 unique viewers.
