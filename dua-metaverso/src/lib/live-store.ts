// In-memory store for chat messages and reactions
// In production, replace with Redis/PostgreSQL for persistence across instances
import type { PresencePayload } from "@/types/user";

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: number;
  avatar?: string;
  flag?: string;
  accentColor?: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  user: string;
  timestamp: number;
}

type Listener = (event: string, data: unknown) => void;

class LiveStore {
  private messages: ChatMessage[] = [];
  private reactions: Reaction[] = [];
  private listeners = new Set<Listener>();
  private viewerCount = 1;

  constructor() {
    // Seed with welcome message
    this.messages.push({
      id: "welcome",
      user: "DUA Bot",
      text: "Bem-vindos ao Metaverso da Lua! O concerto vai começar...",
      timestamp: Date.now(),
      avatar: "🤖",
      flag: "🌍",
    });
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    this.viewerCount = this.listeners.size + 1; // +1 for DJ
    this.broadcast("viewers", { count: this.viewerCount });
    return () => {
      this.listeners.delete(listener);
      this.viewerCount = this.listeners.size + 1;
      this.broadcast("viewers", { count: this.viewerCount });
    };
  }

  private broadcast(event: string, data: unknown) {
    for (const listener of this.listeners) {
      listener(event, data);
    }
  }

  emitUserPresence(payload: PresencePayload) {
    this.broadcast("presence", payload);
  }

  addMessage(msg: Omit<ChatMessage, "id" | "timestamp">) {
    const message: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    this.messages.push(message);
    // Keep last 200 messages in memory
    if (this.messages.length > 200) {
      this.messages = this.messages.slice(-200);
    }
    this.broadcast("message", message);
    return message;
  }

  addReaction(emoji: string, user: string) {
    const reaction: Reaction = {
      id: `react-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      emoji,
      user,
      timestamp: Date.now(),
    };
    this.reactions.push(reaction);
    if (this.reactions.length > 500) {
      this.reactions = this.reactions.slice(-500);
    }
    this.broadcast("reaction", reaction);
    return reaction;
  }

  getMessages(limit = 50) {
    return this.messages.slice(-limit);
  }

  getViewerCount() {
    return this.viewerCount;
  }

  getSubscriberCount() {
    return this.listeners.size;
  }
}

// Singleton
export const liveStore = new LiveStore();
