import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_TTL = 4 * 60 * 60; // 4h

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const identity = searchParams.get("identity")?.trim().slice(0, 64);
  const isHost = searchParams.get("role") === "host";

  if (!identity || identity.length < 1) {
    return NextResponse.json({ error: "identity required" }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;

  // Tier 1 — LiveKit Cloud
  if (apiKey && apiSecret && wsUrl) {
    try {
      const { AccessToken } = await import("livekit-server-sdk");
      const at = new AccessToken(apiKey, apiSecret, {
        identity,
        ttl: MAX_TTL,
        name: identity,
      });
      at.addGrant({
        roomJoin: true,
        room: "dua-metaverso",
        canPublish: isHost,
        canSubscribe: true,
        canPublishData: isHost,
        roomAdmin: isHost,
      });
      const token = await at.toJwt();
      return NextResponse.json({ token, wsUrl, mode: "livekit" });
    } catch (err) {
      console.error("[livekit-token] LiveKit error:", err);
      // fall through to demo mode
    }
  }

  // Tier 2 — demo mode (no real LiveKit, UI shows mock room)
  return NextResponse.json(
    {
      token: null,
      wsUrl: null,
      mode: "demo",
      reason: !apiKey ? "LIVEKIT_API_KEY not set" : "LiveKit unavailable",
    },
    { status: 503 }
  );
}
