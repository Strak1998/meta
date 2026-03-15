import { NextResponse } from "next/server";
import { liveStore } from "@/lib/live-store";
import { concertStore } from "@/lib/concert-store";

export const runtime = "nodejs";

const startedAt = Date.now();

export async function GET(): Promise<NextResponse> {
  const subscriberCount = liveStore.getSubscriberCount();
  const concertState = concertStore.state;
  const commandLog = concertState.commandLog;
  const lastCommand = commandLog.length > 0 ? commandLog[commandLog.length - 1] : null;

  const mem = process.memoryUsage();
  const toMB = (bytes: number): number => Math.round((bytes / 1024 / 1024) * 100) / 100;

  const sseActive = subscriberCount > 0;
  const concertActive = concertStore.activeViewers > 0 || concertState.phase !== "opening";

  const hasDegradation = concertState.isPaused;

  return NextResponse.json({
    status: hasDegradation ? "degraded" : "ok",
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    version: process.env.npm_package_version ?? "1.0.0",
    timestamp: new Date().toISOString(),
    subsystems: {
      sse: {
        status: sseActive ? "active" : "inactive",
        subscribers: subscriberCount,
      },
      concert: {
        status: concertActive ? "active" : "inactive",
        phase: concertState.phase,
        viewers: concertStore.activeViewers,
      },
      lastEvent: lastCommand ? new Date(lastCommand.timestamp).toISOString() : null,
    },
    memory: {
      heapUsed: toMB(mem.heapUsed),
      heapTotal: toMB(mem.heapTotal),
      rss: toMB(mem.rss),
    },
  });
}
