import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, X } from 'lucide-react';
import { ProgressRing } from '../ui/ProgressRing';
import { formatClock } from '../../lib/format';
import type { Countdown } from '../../hooks/useCountdown';

/** Floating rest pill shown above the workout finish bar while resting. */
export function RestTimerBar({ timer }: { timer: Countdown }) {
  const secs = Math.ceil(timer.remainingMs / 1000);
  const frac = timer.totalMs > 0 ? timer.remainingMs / timer.totalMs : 0;

  return (
    <AnimatePresence>
      {timer.active && (
        <motion.div
          className="fixed inset-x-0 bottom-[calc(86px+var(--sab))] z-40 flex justify-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="card flex w-full max-w-md items-center gap-3 px-3 py-2.5">
            <ProgressRing value={frac} size={46} stroke={5} color="#1FD0B0">
              <span className="text-[11px] font-bold tabular-nums">{secs}</span>
            </ProgressRing>

            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400">Rest</p>
              <p className="text-[19px] font-bold tabular-nums leading-none">
                {formatClock(secs)}
              </p>
            </div>

            <button
              onClick={() => timer.add(-15000)}
              className="press rounded-xl bg-black/5 px-2.5 py-1.5 text-[13px] font-bold dark:bg-white/10"
            >
              −15
            </button>
            <button
              onClick={() => timer.add(15000)}
              className="press rounded-xl bg-black/5 px-2.5 py-1.5 text-[13px] font-bold dark:bg-white/10"
            >
              +15
            </button>
            <button
              onClick={() => (timer.paused ? timer.resume() : timer.pause())}
              className="press flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink"
            >
              {timer.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button
              onClick={timer.reset}
              className="press flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
