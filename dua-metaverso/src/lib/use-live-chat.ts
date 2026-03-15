"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage } from "@/lib/live-store";
import type { PresencePayload, UserProfile } from "@/types/user";

const BACKOFF_STEPS = [1000, 2000, 4000, 8000, 16000, 30000];

export function useLiveChat(username: string, avatar?: string, flag?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewers, setViewers] = useState(1);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<UserProfile[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/chat");
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      retryCountRef.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "init":
            setMessages(data.messages || []);
            setViewers(data.viewers || 1);
            setActiveUsers(data.users || []);
            break;
          case "message":
            setMessages((prev) => {
              const msg = { id: data.id, user: data.user, text: data.text, timestamp: data.timestamp, avatar: data.avatar, flag: data.flag };
              const next = [...prev, msg];
              return next.slice(-100);
            });
            break;
          case "viewers":
            setViewers(data.count || 1);
            break;
          case "presence":
            setActiveUsers((prev) => {
              const payload = data as PresencePayload;
              if (payload.action === "remove" && payload.userId) {
                return prev.filter((user) => user.id !== payload.userId);
              }
              if (!payload.user) {
                return prev;
              }
              const next = prev.filter((user) => user.id !== payload.user!.id);
              next.push(payload.user);
              next.sort((a, b) => a.joinedAt - b.joinedAt);
              return next;
            });
            break;
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      eventSourceRef.current = null;

      const idx = Math.min(retryCountRef.current, BACKOFF_STEPS.length - 1);
      const delay = BACKOFF_STEPS[idx];
      retryCountRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
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
          body: JSON.stringify({ user: username, text, avatar, flag }),
        });
      } catch {
        // Fire and forget
      }
    },
    [username, avatar, flag]
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
        // Fire and forget
      }
    },
    [username]
  );

  return { messages, viewers, connected, activeUsers, sendMessage, sendReaction };
}
