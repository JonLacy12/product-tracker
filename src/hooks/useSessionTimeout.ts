import { useEffect, useRef, useCallback } from "react";
import { useSessionStore } from "@/store/useSessionStore";

const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;
const CHECK_INTERVAL = 10_000;

export function useSessionTimeout() {
  const locked = useSessionStore((s) => s.locked);
  const lock = useSessionStore((s) => s.lock);
  const lastActivity = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    if (locked) return;

    lastActivity.current = Date.now();

    for (const event of EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    const interval = setInterval(() => {
      if (lastActivity.current !== null && Date.now() - lastActivity.current >= SESSION_TIMEOUT_MS) {
        lock();
      }
    }, CHECK_INTERVAL);

    return () => {
      for (const event of EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
      clearInterval(interval);
    };
  }, [locked, lock, resetTimer]);
}
