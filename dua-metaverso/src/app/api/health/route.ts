import { liveStore } from "@/lib/live-store";

/*
  Health check endpoint — required for monitoring and uptime alerts.
  Returns version, message counts, viewer count, and external service status.
*/

const START_TIME = Date.now();

export async function GET() {
  const livekitConfigured =
    Boolean(process.env.NEXT_PUBLIC_LIVEKIT_URL) &&
    Boolean(process.env.LIVEKIT_API_KEY) &&
    Boolean(process.env.LIVEKIT_API_SECRET);

  return Response.json({
    status: "ok",
    version: process.env.npm_package_version ?? "0.1.0",
    uptime_ms: Date.now() - START_TIME,
    messages: liveStore.getMessages(1).length > 0 ? "ok" : "empty",
    viewers: liveStore.getViewerCount(),
    services: {
      chat: "ok",
      livekit: livekitConfigured ? "configured" : "demo_mode",
    },
    env: process.env.NODE_ENV,
  });
}
