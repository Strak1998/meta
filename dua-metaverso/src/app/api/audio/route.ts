import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BACKSTAGE_JWT_SECRET ?? "change-me-in-production-32chars!!"
);

const UPLOAD_DIR = join(process.cwd(), "public", "audio");

async function verifyJwt(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("bs_token")?.value;
  if (!token) return false;
  try { await jwtVerify(token, JWT_SECRET); return true; } catch { return false; }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!await verifyJwt(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });

  const allowed = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm", "audio/aac", "audio/mp4"];
  if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|webm|aac|m4a)$/i)) {
    return NextResponse.json({ error: "Invalid audio format" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = join(UPLOAD_DIR, safeName);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const url = `/audio/${safeName}`;
  return NextResponse.json({ url, name: file.name, size: file.size });
}
