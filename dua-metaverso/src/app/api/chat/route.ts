import { NextRequest } from "next/server";
import { liveStore } from "@/lib/live-store";

// POST /api/chat — send a new chat message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, text, avatar, flag } = body;

    if (!user || !text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({ error: "user and text are required" }, { status: 400 });
    }

    if (text.length > 500) {
      return Response.json({ error: "message too long (max 500)" }, { status: 400 });
    }

    const message = liveStore.addMessage({
      user: String(user).slice(0, 30),
      text: text.trim().slice(0, 500),
      avatar,
      flag,
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
