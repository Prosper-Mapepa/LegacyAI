"use client";

import { useSyncExternalStore } from "react";
const KEY = "legacyai.session.v2";

export type Session = { accountId: string };

const listeners = new Set<() => void>();
let snapshot: Session | null = null;
let loaded = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { accountId?: string };
    if (parsed?.accountId) snapshot = { accountId: parsed.accountId };
  } catch {
    snapshot = null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return snapshot;
}

function getServerSnapshot(): Session | null {
  return null;
}

export function useSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setSession(accountId: string) {
  load();
  snapshot = { accountId };
  window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  emit();
}

export function clearSession() {
  load();
  snapshot = null;
  window.localStorage.removeItem(KEY);
  emit();
}

function subscribeReady() {
  return () => {};
}

export function useClientReady() {
  return useSyncExternalStore(subscribeReady, () => true, () => false);
}
