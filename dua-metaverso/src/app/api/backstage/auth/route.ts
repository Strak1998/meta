import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

export const runtime = "nodejs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BACKSTAGE_JWT_SECRET ?? "change-me-in-production-32chars!!"
);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { password } = await req.json().catch(() => ({}) as Record<string, string>);
  const expected = process.env.BACKSTAGE_PASSWORD ?? "backstage2024";
  if (!password || password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const token = await new SignJWT({ role: "host" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("bs_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 28800, path: "/" });
  return res;
}

export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("bs_token");
  return res;
}
