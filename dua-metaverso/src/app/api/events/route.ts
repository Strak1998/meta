import { NextRequest } from "next/server";
import type { ArtistSlot, ConcertCommand, ConcertState } from "@/types/artist";
import { DEFAULT_CONCERT_STATE } from "@/types/artist";

export const maxDuration = 300;

let concertState: ConcertState = { ...DEFAULT_CONCERT_STATE };
const listeners = new Set<ReadableStreamDefaultController<Uint8Array>>();
const encoder = new TextEncoder();

function broadcast(event: string, data: unknown) {
  const payload = encoder.encode(
    `data: ${JSON.stringify({ event, ...data as Record<string, unknown> })}\n\n`
  );
  for (const controller of listeners) {
    try { controller.enqueue(payload); } catch { /* client disconnected */ }
  }
}

export async function GET() {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ event: "state", ...concertState })}\n\n`
      ));
      listeners.add(controller);
    },
    cancel(controller) {
      listeners.delete(controller as ReadableStreamDefaultController<Uint8Array>);
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

export async function POST(request: NextRequest) {
  const hostSecret = process.env.HOST_SECRET;
  if (hostSecret && request.headers.get("x-host-secret") !== hostSecret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json() as { action: string; payload?: Record<string, unknown> };
    const { action, payload } = body;

    if (action === "PHASE_CHANGE") {
      const phase = payload?.phase as string;
      if (!phase) return Response.json({ error: "phase required" }, { status: 400 });
      concertState = { ...concertState, phase };
      broadcast("phase", { phase });
    } else if (action === "ARTIST_STATUS") {
      const { id, status } = (payload ?? {}) as { id?: string; status?: string };
      if (!id || !status) return Response.json({ error: "id and status required" }, { status: 400 });
      concertState = {
        ...concertState,
        artists: concertState.artists.map((a: ArtistSlot) =>
          a.id === id ? { ...a, status: status as ArtistSlot["status"] } : a
        ),
      };
      broadcast("artist_status", { id, status });
    } else if (action === "COMMAND") {
      const cmd: ConcertCommand = {
        id: `cmd-${Date.now()}`,
        type: (payload?.type as ConcertCommand["type"]) ?? "CONFETTI",
        ts: Date.now(),
        payload: payload?.data as ConcertCommand["payload"],
      };
      concertState = { ...concertState, commandLog: [...concertState.commandLog.slice(-50), cmd] };
      broadcast("command", cmd);
    } else {
      return Response.json({ error: "unknown action" }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
}
