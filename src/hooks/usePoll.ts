"use client";
import { useEffect, useRef } from "react";

/**
 * Runs `callback` every `intervalMs` while the tab is visible, and once straight away when it
 * becomes visible again. Hidden tabs make no requests. Overlapping runs are skipped.
 */
export function usePoll(callback: () => Promise<void> | void, intervalMs: number, { immediate = false } = {}) {
  const saved = useRef(callback);
  useEffect(() => { saved.current = callback; });
  useEffect(() => {
    let timer: number | undefined;
    let busy = false;
    const tick = async () => {
      if (busy) return;
      busy = true;
      try { await saved.current(); } catch { /* the next tick retries */ } finally { busy = false; }
    };
    const start = () => { timer ??= window.setInterval(tick, intervalMs); };
    const stop = () => { window.clearInterval(timer); timer = undefined; };
    const onVisibility = () => {
      if (document.visibilityState === "visible") { void tick(); start(); } else stop();
    };
    if (document.visibilityState === "visible") { if (immediate) void tick(); start(); }
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [intervalMs, immediate]);
}

/** JSON GET for polls. On a lapsed session, reloading lets the protected layout redirect to sign in. */
export async function pollJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (response.status === 401) { window.location.reload(); return null; }
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}
