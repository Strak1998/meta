import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { concertStore } from "@/lib/event-store";

export const runtime = "nodejs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BACKSTAGE_JWT_SECRET ?? "change-me-in-production-32-chars!!"
);

async function verifyToken(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("backstage_token")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const valid = await verifyToken(req);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const analytics = concertStore.getAnalytics();
  const state = concertStore.getState();

  const phaseElapsed = Date.now() - (state.phaseStartedAt ?? Date.now());

  return NextResponse.json({
    ...analytics,
    currentPhase: state.phase,
    phaseElapsedMs: phaseElapsed,
    isPaused: state.isPaused,
    estimatedConversionRate:
      analytics.activeViewers > 0
        ? ((analytics.ctaClicks / Math.max(analytics.activeViewers, 1)) * 100).toFixed(1)
        : "0.0",
    updatedAt: Date.now(),
  });
}
