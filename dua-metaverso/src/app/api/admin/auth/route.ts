import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export const runtime = "nodejs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BACKSTAGE_JWT_SECRET ?? "change-me-in-production-32-chars!!"
);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: string };

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const storedHash = process.env.BACKSTAGE_PASSWORD_HASH;
  const plainPassword = process.env.BACKSTAGE_PASSWORD;

  let valid = false;

  if (storedHash) {
    valid = await bcrypt.compare(password, storedHash);
  } else if (plainPassword) {
    valid = password === plainPassword;
  } else {
    valid = password === "backstage2024";
  }

  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await new SignJWT({ role: "host" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);

  const response = NextResponse.json({ ok: true });
  response.cookies.set("backstage_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return response;
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("backstage_token");
  return response;
}
