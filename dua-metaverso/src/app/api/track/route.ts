import { NextRequest } from "next/server";

/*
  Conversion tracking endpoint — zero external dependencies.
  Stores events in memory (production: swap for analytics service or DB).
  Each event: { event, phase, ts, ua (truncated) }
*/

interface TrackEvent {
  event: string;
  phase: string;
  ts: number;
  ua: string;
}

const ALLOWED_EVENTS = new Set([
  "cta_click",
  "modal_open",
  "modal_convert",
  "modal_dismiss",
  "music_request",
  "music_generate",
  "voice_join",
  "phase_change",
]);

/* In-memory buffer — last 1000 events */
const events: TrackEvent[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, phase } = body as { event?: string; phase?: string };

    if (!event || !ALLOWED_EVENTS.has(event)) {
      return Response.json({ error: "invalid event" }, { status: 400 });
    }

    const trackEvent: TrackEvent = {
      event,
      phase: typeof phase === "string" ? phase : "unknown",
      ts: Date.now(),
      /* Store only the first 50 chars of UA to avoid PII accumulation */
      ua: (request.headers.get("user-agent") ?? "").slice(0, 50),
    };

    events.push(trackEvent);
    if (events.length > 1000) events.shift();

    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
}

/* GET /api/track — returns aggregate counts (host monitoring) */
export async function GET() {
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.event] = (counts[e.event] ?? 0) + 1;
  }
  return Response.json({ total: events.length, counts });
}
