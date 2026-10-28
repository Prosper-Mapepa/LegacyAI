"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { initialState, reduce } from "./reduce";
import type { Action, DemoState } from "./types";

const KEY = "legacyai.book.v5";

type LegacyApi = {
  state: DemoState;
  dispatch: (action: Action) => void;
};

const listeners = new Set<() => void>();
const serverSnapshot = initialState();
let snapshot: DemoState = serverSnapshot;
let loaded = false;

function readStored(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    if (!parsed || !Array.isArray(parsed.households)) return null;
    if (parsed.households.length !== serverSnapshot.households.length) return null;
    return {
      ...parsed,
      advisorNotices: Array.isArray(parsed.advisorNotices)
        ? parsed.advisorNotices
        : [],
    };
  } catch {
    return null;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const stored = readStored();
  if (stored) snapshot = stored;
}

function emit() {
  window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return snapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}

function dispatch(action: Action) {
  load();
  snapshot = reduce(snapshot, action);
  emit();
}

const LegacyContext = createContext<LegacyApi | null>(null);

export function LegacyProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const api = useMemo<LegacyApi>(() => ({ state, dispatch }), [state]);
  return <LegacyContext.Provider value={api}>{children}</LegacyContext.Provider>;
}

export function useLegacy() {
  const value = useContext(LegacyContext);
  if (!value) throw new Error("useLegacy must be used inside LegacyProvider");
  return value;
}
