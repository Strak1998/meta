import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BACKSTAGE_JWT_SECRET ?? "change-me-in-production-32chars!!"
);

interface VitalEntry {
  metric: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  navigationType: string;
  url: string;
  timestamp: string;
  receivedAt: string;
}

const KNOWN_METRICS = ["LCP", "FID", "CLS", "FCP", "TTFB", "INP"] as const;
type MetricName = (typeof KNOWN_METRICS)[number];

const vitalsStore = new Map<string, VitalEntry[]>();
const MAX_ENTRIES_PER_METRIC = 200;

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, idx)];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    metric?: string;
    value?: number;
    rating?: string;
    navigationType?: string;
    url?: string;
    timestamp?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { metric, value, rating, navigationType, url, timestamp } = body;

  if (
    typeof metric !== "string" ||
    typeof value !== "number" ||
    typeof rating !== "string" ||
    typeof navigationType !== "string" ||
    typeof url !== "string" ||
    typeof timestamp !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing required fields: metric, value, rating, navigationType, url, timestamp" },
      { status: 400 }
    );
  }

  if (!["good", "needs-improvement", "poor"].includes(rating)) {
    return NextResponse.json(
      { error: "Invalid rating. Must be: good, needs-improvement, or poor" },
      { status: 400 }
    );
  }

  const entry: VitalEntry = {
    metric,
    value,
    rating: rating as VitalEntry["rating"],
    navigationType,
    url,
    timestamp,
    receivedAt: new Date().toISOString(),
  };

  const entries = vitalsStore.get(metric) ?? [];
  entries.push(entry);

  // Keep last 200 entries per metric type
  if (entries.length > MAX_ENTRIES_PER_METRIC) {
    entries.splice(0, entries.length - MAX_ENTRIES_PER_METRIC);
  }

  vitalsStore.set(metric, entries);

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

  const aggregated: Record<
    string,
    { p50: number; p75: number; p95: number; count: number; lastValue: number }
  > = {};

  for (const metricName of KNOWN_METRICS) {
    const entries = vitalsStore.get(metricName);

    if (!entries || entries.length === 0) {
      aggregated[metricName] = { p50: 0, p75: 0, p95: 0, count: 0, lastValue: 0 };
      continue;
    }

    const sortedValues = entries.map((e) => e.value).sort((a, b) => a - b);
    const lastValue = entries[entries.length - 1].value;

    aggregated[metricName] = {
      p50: percentile(sortedValues, 50),
      p75: percentile(sortedValues, 75),
      p95: percentile(sortedValues, 95),
      count: entries.length,
      lastValue,
    };
  }

  return NextResponse.json({
    vitals: aggregated,
    collectedAt: new Date().toISOString(),
  });
}
