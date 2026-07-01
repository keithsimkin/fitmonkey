import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  onDone?: () => void;
  /** Fires once whenever the displayed (ceil) second changes, while running. */
  onTick?: (secondsLeft: number) => void;
}

export interface Countdown {
  remainingMs: number;
  totalMs: number;
  running: boolean;
  paused: boolean;
  active: boolean;
  start: (ms: number) => void;
  pause: () => void;
  resume: () => void;
  add: (ms: number) => void;
  reset: () => void;
}

/**
 * Timestamp-based countdown. Remaining time is always derived from a target
 * `endsAt` and `Date.now()`, never by counting ticks — so it stays correct
 * across iOS background throttling and recomputes instantly on resume.
 */
export function useCountdown({ onDone, onTick }: Options = {}): Countdown {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [totalMs, setTotalMs] = useState(0);
  const fired = useRef(true);
  const lastSec = useRef(-1);
  const onDoneRef = useRef(onDone);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onDoneRef.current = onDone;
    onTickRef.current = onTick;
  });

  useEffect(() => {
    if (endsAt == null) return;
    const update = () => {
      const rem = Math.max(0, endsAt - Date.now());
      setRemainingMs(rem);
      const sec = Math.ceil(rem / 1000);
      if (rem > 0 && sec !== lastSec.current) {
        lastSec.current = sec;
        onTickRef.current?.(sec);
      }
      if (rem <= 0 && !fired.current) {
        fired.current = true;
        onDoneRef.current?.();
        setEndsAt(null);
      }
    };
    update();
    const id = window.setInterval(update, 250);
    const onVis = () => {
      if (!document.hidden) update();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [endsAt]);

  const start = useCallback((ms: number) => {
    fired.current = false;
    lastSec.current = -1;
    setPausedRemaining(null);
    setTotalMs(ms);
    setRemainingMs(ms);
    setEndsAt(Date.now() + ms);
  }, []);

  const pause = useCallback(() => {
    setEndsAt((e) => {
      if (e == null) return e;
      setPausedRemaining(Math.max(0, e - Date.now()));
      return null;
    });
  }, []);

  const resume = useCallback(() => {
    setPausedRemaining((p) => {
      if (p == null) return p;
      fired.current = false;
      setEndsAt(Date.now() + p);
      return null;
    });
  }, []);

  const add = useCallback((ms: number) => {
    setTotalMs((t) => Math.max(0, t + Math.max(0, ms)));
    setEndsAt((e) => (e == null ? e : e + ms));
    setPausedRemaining((p) => (p == null ? p : Math.max(0, p + ms)));
    setRemainingMs((r) => Math.max(0, r + ms));
  }, []);

  const reset = useCallback(() => {
    fired.current = true; // suppress onDone on manual reset/skip
    setEndsAt(null);
    setPausedRemaining(null);
    setRemainingMs(0);
    setTotalMs(0);
  }, []);

  return {
    remainingMs: pausedRemaining ?? remainingMs,
    totalMs,
    running: endsAt != null,
    paused: pausedRemaining != null,
    active: endsAt != null || pausedRemaining != null,
    start,
    pause,
    resume,
    add,
    reset,
  };
}
