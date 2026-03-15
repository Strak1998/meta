import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { concertStore } from "@/lib/concert-store";

export const runtime = "nodejs";
const JWT_SECRET = new TextEncoder().encode(process.env.BACKSTAGE_JWT_SECRET ?? "change-me-in-production-32chars!!");

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get("bs_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { await jwtVerify(token, JWT_SECRET); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const s = concertStore.state;
  return NextResponse.json({
    activeViewers: concertStore.activeViewers,
    viewerPeak: concertStore.viewerPeak,
    messagesTotal: concertStore.messagesTotal,
    reactionsTotal: concertStore.reactionsTotal,
    ctaClicks: concertStore.ctaClicks,
    currentPhase: s.phase,
    phaseElapsedMs: Date.now() - s.phaseStartedAt,
    isPaused: s.isPaused,
    conversionRate: concertStore.activeViewers > 0 ? ((concertStore.ctaClicks / concertStore.activeViewers) * 100).toFixed(1) : "0.0",
    updatedAt: Date.now(),
  });
}
