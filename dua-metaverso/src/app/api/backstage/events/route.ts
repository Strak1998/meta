import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { concertStore } from "@/lib/concert-store";
import type { CommandType } from "@/types/artist";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const JWT_SECRET = new TextEncoder().encode(
  process.env.BACKSTAGE_JWT_SECRET ?? "change-me-in-production-32chars!!"
);

const VALID: CommandType[] = [
  "PHASE_CHANGE","ARTIST_ENTER","ARTIST_EXIT","SPOTLIGHT","AUDIO_SOURCE",
  "CHAT_HIGHLIGHT","CHAT_BROADCAST","CTA_TRIGGER","OVERLAY_SHOW","OVERLAY_HIDE",
  "CONFETTI","EMERGENCY_PAUSE","EMERGENCY_RESUME",
];

async function verifyJwt(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("bs_token")?.value;
  if (!token) return false;
  try { await jwtVerify(token, JWT_SECRET); return true; } catch { return false; }
}

export async function GET(): Promise<Response> {
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(ctrl) {
      concertStore.trackViewer(1);
      const enc = new TextEncoder();

      const init = JSON.stringify({ type: "PHASE_CHANGE", payload: { init: true, state: concertStore.state }, timestamp: Date.now() });
      ctrl.enqueue(enc.encode("data: " + init + "\n\n"));

      const unsub = concertStore.subscribe(cmd => {
        try { ctrl.enqueue(enc.encode("data: " + JSON.stringify(cmd) + "\n\n")); } catch {}
      });

      const ka = setInterval(() => {
        try { ctrl.enqueue(enc.encode(": ping\n\n")); } catch { clearInterval(ka); }
      }, 20_000);

      cleanup = () => {
        clearInterval(ka);
        unsub();
        concertStore.trackViewer(-1);
      };
    },
    cancel() {
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!await verifyJwt(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!concertStore.checkRate("host")) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const { type, payload } = await req.json().catch(() => ({}) as { type: CommandType; payload: Record<string, unknown> });
  if (!type || !VALID.includes(type)) return NextResponse.json({ error: "Invalid command" }, { status: 400 });

  concertStore.dispatch(type, payload ?? {}, "host");
  return NextResponse.json({ ok: true, ts: Date.now() });
}
