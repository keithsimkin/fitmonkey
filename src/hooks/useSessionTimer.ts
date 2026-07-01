import { useEffect, useState } from 'react';

/**
 * Elapsed seconds since `startedAt` (a timestamp). Timestamp-based so it stays
 * correct after the app is backgrounded; recomputes on resume. Returns 0 when
 * no session has started.
 */
export function useSessionTimer(startedAt: number | undefined): number {
  const [elapsedMs, setElapsedMs] = useState(() => (startedAt ? Date.now() - startedAt : 0));

  useEffect(() => {
    if (!startedAt) {
      setElapsedMs(0);
      return;
    }
    const update = () => setElapsedMs(Date.now() - startedAt);
    update();
    const id = window.setInterval(update, 1000);
    const onVis = () => {
      if (!document.hidden) update();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [startedAt]);

  return Math.max(0, Math.floor(elapsedMs / 1000));
}
