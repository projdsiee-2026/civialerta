/**
 * Assistant conversations saved in this browser (localStorage).
 * Each thread: { id, title, updatedAt, messages: UIMessage[] }.
 */
import { useSyncExternalStore } from "react";
import type { UIMessage } from "ai";

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
}

const KEY = "aci-chat-threads-v1";
const listeners = new Set<() => void>();
let cache: ChatThread[] | null = null;
const EMPTY: ChatThread[] = [];

function read(): ChatThread[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as ChatThread[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(threads: ChatThread[]) {
  cache = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full — keep in memory */
  }
  listeners.forEach((l) => l());
}

export function getThreads() {
  return read();
}

export function getThread(id: string) {
  return read().find((t) => t.id === id);
}

/** Returns the thread with this id, creating an empty one if missing. */
export function ensureThread(id: string): ChatThread {
  const existing = getThread(id);
  if (existing) return existing;
  const t: ChatThread = { id, title: "Nova conversa", updatedAt: Date.now(), messages: [] };
  write([t, ...read()]);
  return t;
}

export function createThread(): ChatThread {
  return ensureThread(crypto.randomUUID());
}

function titleFrom(messages: UIMessage[]) {
  const first = messages.find((m) => m.role === "user");
  const text = first?.parts.find((p) => p.type === "text");
  const t = text && "text" in text ? text.text.trim() : "";
  return t ? (t.length > 48 ? `${t.slice(0, 48)}…` : t) : "Nova conversa";
}

export function saveMessages(id: string, messages: UIMessage[]) {
  const threads = read();
  const prev = threads.find((t) => t.id === id);
  if (prev && prev.messages.length === messages.length && JSON.stringify(prev.messages) === JSON.stringify(messages)) return;
  const next: ChatThread = { id, title: titleFrom(messages), updatedAt: Date.now(), messages };
  write([next, ...threads.filter((t) => t.id !== id)]);
}

export function deleteThread(id: string) {
  write(read().filter((t) => t.id !== id));
}

export function useThreads(): ChatThread[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) {
          cache = null;
          l();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(l);
        window.removeEventListener("storage", onStorage);
      };
    },
    read,
    () => EMPTY,
  );
}
