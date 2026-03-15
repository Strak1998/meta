import { NextRequest } from "next/server";
import { getActiveUser } from "@/lib/user-store";

const USER_COOKIE = "dua_user_id";

export async function GET(request: NextRequest) {
  const userId = request.cookies.get(USER_COOKIE)?.value;
  if (!userId) {
    return Response.json({ error: "no session" }, { status: 404 });
  }

  const user = getActiveUser(userId);
  if (!user) {
    return Response.json({ error: "session expired" }, { status: 404 });
  }

  return Response.json(user, { status: 200 });
}
