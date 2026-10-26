"use client";

import { useSyncExternalStore } from "react";

const KEY = "legacyai.demo.completed.v1";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function readCompleted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Persist that the guided demo finished end-to-end (survives Reset demo). */
export function markDemoCompleted() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, "1");
    emit();
  } catch {
    /* ignore */
  }
}

export function isDemoCompleted() {
  return readCompleted();
}

export function useDemoCompleted() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    readCompleted,
    () => false,
  );
}
