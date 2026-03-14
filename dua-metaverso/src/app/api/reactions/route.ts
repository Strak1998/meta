import { NextRequest } from "next/server";
import { liveStore } from "@/lib/live-store";

// POST /api/reactions — send a reaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emoji, user } = body;

    if (!emoji || !user) {
      return Response.json({ error: "emoji and user required" }, { status: 400 });
    }

    const allowed = ["❤️", "🔥", "🌕", "🎵", "👏", "🚀", "💎", "🎤"];
    if (!allowed.includes(emoji)) {
      return Response.json({ error: "emoji not allowed" }, { status: 400 });
    }

    const reaction = liveStore.addReaction(emoji, String(user).slice(0, 30));
    return Response.json(reaction, { status: 201 });
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
}
