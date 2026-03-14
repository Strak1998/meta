"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage } from "@/lib/live-store";

export function useLiveChat(username: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewers, setViewers] = useState(1);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/chat");
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "init":
            setMessages(data.messages || []);
            setViewers(data.viewers || 1);
            break;
          case "message":
            setMessages((prev) => {
              const next = [...prev, data];
              return next.slice(-100); // Keep last 100 in client
            });
            break;
          case "viewers":
            setViewers(data.count || 1);
            break;
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Reconnect after 3s
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      try {
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: username, text }),
        });
      } catch {
        // Message will retry naturally
      }
    },
    [username]
  );

  const sendReaction = useCallback(
    async (emoji: string) => {
      try {
        await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji, user: username }),
        });
      } catch {
        // Ignore
      }
    },
    [username]
  );

  return { messages, viewers, connected, sendMessage, sendReaction };
}
