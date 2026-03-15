import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BACKSTAGE_JWT_SECRET ?? "change-me-in-production-32chars!!"
);

interface ErrorEntry {
  message: string;
  stack?: string;
  userAgent: string;
  url: string;
  timestamp: string;
  receivedAt: string;
  count: number;
}

const errorLog: ErrorEntry[] = [];
const MAX_ENTRIES = 100;
const DEDUP_WINDOW_MS = 60_000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    message?: string;
    stack?: string;
    userAgent?: string;
    url?: string;
    timestamp?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message, stack, userAgent, url, timestamp } = body;

  if (
    typeof message !== "string" ||
    typeof userAgent !== "string" ||
    typeof url !== "string" ||
    typeof timestamp !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing required fields: message, userAgent, url, timestamp" },
      { status: 400 }
    );
  }

  const now = Date.now();
  const receivedAt = new Date(now).toISOString();

  // Deduplication: same message within 60 seconds increments count
  const existing = errorLog.find(
    (entry) =>
      entry.message === message &&
      now - new Date(entry.receivedAt).getTime() < DEDUP_WINDOW_MS
  );

  if (existing) {
    existing.count += 1;
    existing.receivedAt = receivedAt;
    existing.timestamp = timestamp;
    if (stack) existing.stack = stack;
  } else {
    const entry: ErrorEntry = {
      message,
      stack,
      userAgent,
      url,
      timestamp,
      receivedAt,
      count: 1,
    };

    errorLog.push(entry);

    // FIFO: remove oldest entries when exceeding max
    while (errorLog.length > MAX_ENTRIES) {
      errorLog.shift();
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get("bs_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await jwtVerify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    errors: errorLog,
    total: errorLog.length,
  });
}
