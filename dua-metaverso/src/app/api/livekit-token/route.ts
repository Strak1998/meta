import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

interface TokenRequest {
  roomName: string;
  participantName: string;
  role?: "host" | "guest";
}

export async function POST(request: NextRequest) {
  try {
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return NextResponse.json(
        {
          error: "LiveKit not configured",
          message: "LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set",
          fallback: "demo",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as TokenRequest;
    const { roomName, participantName, role = "guest" } = body;

    if (!roomName || !participantName) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "roomName and participantName are required",
        },
        { status: 400 }
      );
    }

    if (participantName.length > 100) {
      return NextResponse.json(
        {
          error: "Invalid participant name",
          message: "Participant name must be less than 100 characters",
        },
        { status: 400 }
      );
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      ttl: "4h",
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: role === "host",
      canPublishData: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      serverUrl: process.env.LIVEKIT_URL || "wss://dua-metaverso.livekit.cloud",
    });
  } catch (error) {
    console.error("[LiveKit Token] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
