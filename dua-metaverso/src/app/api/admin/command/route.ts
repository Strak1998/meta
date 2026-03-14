import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { concertStore } from "@/lib/event-store";
import type { CommandType } from "@/types/artist";

export const runtime = "nodejs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BACKSTAGE_JWT_SECRET ?? "change-me-in-production-32-chars!!"
);

const VALID_COMMANDS: CommandType[] = [
  "PHASE_CHANGE",
  "ARTIST_ENTER",
  "ARTIST_EXIT",
  "SPOTLIGHT",
  "AUDIO_SOURCE",
  "CHAT_HIGHLIGHT",
  "CHAT_BROADCAST",
  "CTA_TRIGGER",
  "OVERLAY_SHOW",
  "OVERLAY_HIDE",
  "CONFETTI",
  "EMERGENCY_PAUSE",
  "EMERGENCY_RESUME",
];

async function verifyToken(req: NextRequest): Promise<{ valid: boolean; identity: string }> {
  const token = req.cookies.get("backstage_token")?.value;
  if (!token) return { valid: false, identity: "" };
  try {
    await jwtVerify(token, JWT_SECRET);
    return { valid: true, identity: "host" };
  } catch {
    return { valid: false, identity: "" };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { valid, identity } = await verifyToken(req);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!concertStore.checkRateLimit(identity)) {
    return NextResponse.json({ error: "Rate limit exceeded (60/min)" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { type, payload } = body as {
    type?: CommandType;
    payload?: Record<string, unknown>;
  };

  if (!type || !VALID_COMMANDS.includes(type)) {
    return NextResponse.json({ error: "Invalid command type" }, { status: 400 });
  }

  concertStore.dispatch(type, payload ?? {}, identity);

  return NextResponse.json({ ok: true, timestamp: Date.now() });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { valid } = await verifyToken(req);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ state: concertStore.getState() });
}
