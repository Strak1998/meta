import { NextRequest, NextResponse } from "next/server";
import { liveStore } from "@/lib/live-store";
import { BODY_TO_STYLE } from "@/lib/avatar-bodies";
import { getActiveUsers, getActiveUser, upsertActiveUser } from "@/lib/user-store";
import type { UserProfile, AvatarStyle, AvatarFace, AvatarBody } from "@/types/user";

const VALID_STYLES = new Set<AvatarStyle>(["URBAN", "AFRO", "COSMIC"]);
const VALID_FACES = new Set<AvatarFace>(["A", "B", "C"]);
const VALID_BODIES = new Set<AvatarBody>(["1", "2", "3"]);
const USER_COOKIE = "dua_user_id";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, avatarStyle, avatarFace, avatarBody, country } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }

    if (!country || typeof country !== "string" || country.length !== 2) {
      return Response.json({ error: "country must be a 2-letter code" }, { status: 400 });
    }

    // Accept new face+body fields, fall back to legacy avatarStyle
    const face: AvatarFace = avatarFace && VALID_FACES.has(avatarFace) ? avatarFace : "A";
    const bodyId: AvatarBody = avatarBody && VALID_BODIES.has(avatarBody) ? avatarBody : "1";
    const style: AvatarStyle = avatarStyle && VALID_STYLES.has(avatarStyle) ? avatarStyle : BODY_TO_STYLE[bodyId];
    const existingId = request.cookies.get(USER_COOKIE)?.value;
    const existingUser = existingId ? getActiveUser(existingId) : undefined;

    const user: UserProfile = {
      id: existingUser?.id ?? `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim().slice(0, 30),
      avatarStyle: style,
      avatarFace: face,
      avatarBody: bodyId,
      country: country.toUpperCase(),
      joinedAt: existingUser?.joinedAt ?? Date.now(),
    };

    upsertActiveUser(user);
    liveStore.emitUserPresence({ action: "upsert", user });

    // Propagate USER_JOIN via SSE through the live store broadcast
    liveStore.addMessage({
      user: "SISTEMA",
      text: `${user.name} entrou no concerto`,
    });

    const response = NextResponse.json(user, { status: 201 });
    response.cookies.set(USER_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
}

export async function GET() {
  const users = getActiveUsers();
  return Response.json({ users, count: users.length });
}
