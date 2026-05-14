import type { Agent } from "@/lib/queries/agents";
import type { Conversation } from "@/lib/queries/conversations";

const ACTIVE_MATCH_KEY = "llm-blind.active-match";

export type ActiveMatch = {
  agent: Agent;
  conversation: Conversation;
  savedAt: string;
};

export function saveActiveMatch(match: Omit<ActiveMatch, "savedAt">) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    ACTIVE_MATCH_KEY,
    JSON.stringify({ ...match, savedAt: new Date().toISOString() }),
  );
}

export function loadActiveMatch(conversationId: string): ActiveMatch | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(ACTIVE_MATCH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ActiveMatch;
    return parsed.conversation?.id === conversationId ? parsed : null;
  } catch {
    return null;
  }
}

