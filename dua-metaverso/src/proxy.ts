import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BACKSTAGE_JWT_SECRET ?? "change-me-in-production-32chars!!"
);

export const config = { matcher: ["/backstage/:path*"] };

export async function proxy(req: NextRequest): Promise<NextResponse> {
  if (req.nextUrl.pathname === "/backstage/login") return NextResponse.next();
  const token = req.cookies.get("bs_token")?.value;
  if (!token) {
    const url = new URL("/backstage/login", req.url);
    url.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    const url = new URL("/backstage/login", req.url);
    const res = NextResponse.redirect(url);
    res.cookies.delete("bs_token");
    return res;
  }
}
