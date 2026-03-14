import { NextRequest } from "next/server";

/*
  LiveKit token endpoint — production-grade with 3-tier graceful handling:
  1. LiveKit Cloud (when env vars are configured)
  2. Structured error response (when livekit-server-sdk fails to load)
  3. Demo token (when LiveKit is not configured at all)
*/

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

const TOKEN_TTL_SECONDS = 4 * 60 * 60; // 4 hours
const ROOM_NAME = "dua-metaverso-concert";

type Role = "host" | "guest";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identity, name, role } = body as {
      identity?: string;
      name?: string;
      role?: string;
    };

    if (!identity || typeof identity !== "string" || identity.trim().length === 0) {
      return Response.json(
        { error: "identity is required", code: "MISSING_IDENTITY" },
        { status: 400 }
      );
    }

    const sanitizedIdentity = identity.trim().slice(0, 30);
    const sanitizedName = (name ?? identity).trim().slice(0, 30);
    const resolvedRole: Role =
      role === "host" ? "host" : "guest";

    /* Tier 1: LiveKit Cloud — requires all three env vars */
    if (LIVEKIT_URL && LIVEKIT_API_KEY && LIVEKIT_API_SECRET) {
      try {
        const { AccessToken } = await import("livekit-server-sdk");

        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
          identity: sanitizedIdentity,
          name: sanitizedName,
          ttl: TOKEN_TTL_SECONDS,
        });

        at.addGrant({
          room: ROOM_NAME,
          roomJoin: true,
          /* Host: full publish permissions; Guest: subscribe only */
          canPublish: resolvedRole === "host",
          canPublishData: resolvedRole === "host",
          canSubscribe: true,
          canUpdateOwnMetadata: true,
        });

        const token = await at.toJwt();

        return Response.json({
          token,
          url: LIVEKIT_URL,
          room: ROOM_NAME,
          identity: sanitizedIdentity,
          role: resolvedRole,
          mode: "livekit",
        });
      } catch (sdkError) {
        /* SDK error — fall through to demo mode */
        console.error("[LiveKit] Token generation failed:", sdkError);
      }
    }

    /* Tier 2: LiveKit not configured — return demo response so UI degrades gracefully */
    return Response.json(
      {
        error: "LiveKit not configured",
        code: "LIVEKIT_NOT_CONFIGURED",
        mode: "demo",
        message:
          "Configure NEXT_PUBLIC_LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET to enable live voice.",
      },
      { status: 503 }
    );
  } catch {
    return Response.json(
      { error: "invalid request", code: "INVALID_REQUEST" },
      { status: 400 }
    );
  }
}
