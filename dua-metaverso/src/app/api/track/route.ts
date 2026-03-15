import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/* In-memory event buffer — last 1000 events (resets on cold start) */
interface TrackEvent {
  type: string;
  phase?: string;
  ts: number;
}

const events: TrackEvent[] = [];
const counts: Record<string, number> = {};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { type, phase } = (await req.json()) as { type: string; phase?: string };
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "type required" }, { status: 400 });
    }
    const ev: TrackEvent = { type: type.slice(0, 64), phase: phase?.slice(0, 64), ts: Date.now() };
    if (events.length >= 1000) events.shift();
    events.push(ev);
    counts[ev.type] = (counts[ev.type] ?? 0) + 1;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== (process.env.BACKSTAGE_PASSWORD ?? "backstage2024")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ counts, total: events.length, updatedAt: Date.now() });
}
