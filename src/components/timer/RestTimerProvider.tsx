import { useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useCountdown } from '../../hooks/useCountdown';
import { alertCue, countdownCue, unlockAudio } from '../../lib/audioCue';
import { RestTimerBar } from './RestTimerBar';
import { RestContext, type RestApi } from './restContext';

/**
 * Owns a single rest countdown and renders the floating rest bar. Any descendant
 * can call `startRest(seconds)` (e.g. SetLogger when a set is marked done).
 */
export function RestTimerProvider({ children }: { children: ReactNode }) {
  const timer = useCountdown({
    onDone: alertCue,
    onTick: (secs) => {
      if (secs <= 3) countdownCue(); // 3-2-1 lead-in beeps before rest ends
    },
  });

  // Keep the latest start fn in a ref so the context value stays stable and
  // descendants don't re-render on every tick of an active rest.
  const startRef = useRef(timer.start);
  startRef.current = timer.start;

  const api = useMemo<RestApi>(
    () => ({
      startRest: (seconds: number) => {
        unlockAudio();
        if (seconds > 0) startRef.current(seconds * 1000);
      },
    }),
    [],
  );

  return (
    <RestContext.Provider value={api}>
      {children}
      <RestTimerBar timer={timer} />
    </RestContext.Provider>
  );
}
