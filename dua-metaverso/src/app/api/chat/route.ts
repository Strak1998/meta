import { NextRequest } from "next/server";
import { liveStore } from "@/lib/live-store";

export const maxDuration = 300;

function sanitizeText(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// POST /api/chat — send a new chat message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, text, avatar, flag } = body;

    if (!user || typeof user !== "string" || user.trim().length === 0) {
      return Response.json({ error: "user is required" }, { status: 400 });
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({ error: "text is required" }, { status: 400 });
    }

    if (text.length > 500) {
      return Response.json({ error: "message too long (max 500)" }, { status: 400 });
    }

    const message = liveStore.addMessage({
      user: sanitizeText(String(user).trim().slice(0, 30)),
      text: sanitizeText(text.trim().slice(0, 500)),
      avatar: typeof avatar === "string" ? avatar.slice(0, 10) : undefined,
      flag: typeof flag === "string" ? flag.slice(0, 10) : undefined,
    });

    return Response.json(message, { status: 201 });
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
}

// GET /api/chat — SSE stream for real-time messages + reactions + viewer count
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send existing messages as initial data
      const existing = liveStore.getMessages(50);
      const initData = `data: ${JSON.stringify({ type: "init", messages: existing, viewers: liveStore.getViewerCount() })}\n\n`;
      controller.enqueue(encoder.encode(initData));

      // Subscribe to new events
      const unsubscribe = liveStore.subscribe((event, data) => {
        try {
          const sseData = `data: ${JSON.stringify({ type: event, ...data as Record<string, unknown> })}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch {
          // Client disconnected
        }
      });

      // Cleanup on close — the `cancel` callback handles this
      (controller as unknown as Record<string, unknown>).__unsubscribe = unsubscribe;
    },
    cancel(controller) {
      const unsub = (controller as unknown as Record<string, unknown>)?.__unsubscribe;
      if (typeof unsub === "function") unsub();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
