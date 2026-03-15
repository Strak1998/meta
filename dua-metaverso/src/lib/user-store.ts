import type { UserProfile } from "@/types/user";

const activeUsers = new Map<string, UserProfile>();

export function getActiveUsers(): UserProfile[] {
  return Array.from(activeUsers.values()).sort((a, b) => a.joinedAt - b.joinedAt);
}

export function getActiveUser(id: string): UserProfile | undefined {
  return activeUsers.get(id);
}

export function upsertActiveUser(user: UserProfile): UserProfile {
  activeUsers.set(user.id, user);
  return user;
}

export function removeActiveUser(id: string): boolean {
  return activeUsers.delete(id);
}
