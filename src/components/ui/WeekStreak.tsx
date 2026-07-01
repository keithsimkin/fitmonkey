import { Flame, Check, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { weekStrip, type WeekDayCell } from '../../lib/stats';
import type { DailyLog } from '../../types/app';

interface Props {
  logs: Record<string, DailyLog>;
  weekStartsOn: 0 | 1;
  streak: number;
  /** When set, the whole card becomes a button that opens the streak history. */
  onOpen?: () => void;
}

/**
 * Home header card: today's long date, the current-week strip (trained days
 * filled, today ringed), and the running streak count. Tapping it (when
 * `onOpen` is provided) opens the full streak-history calendar.
 */
export function WeekStreak({ logs, weekStartsOn, streak, onOpen }: Props) {
  const today = new Date();
  const cells = weekStrip(logs, today, weekStartsOn);

  const inner = (
    <>
      <div className="mb-3.5 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-400">Today</p>
          <p className="truncate text-[17px] font-bold leading-tight">
            {format(today, 'EEEE, MMMM d')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex items-center gap-1.5 rounded-full bg-coral-soft px-3 py-1.5 text-coral dark:bg-coral/15">
            <Flame className="h-4 w-4" />
            <span className="text-[13px] font-bold tabular-nums">
              {streak} day{streak === 1 ? '' : 's'}
            </span>
          </div>
          {onOpen && <ChevronRight className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />}
        </div>
      </div>

      <div className="flex justify-between">
        {cells.map((c) => (
          <div key={c.dayKey} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase text-neutral-400">
              {format(c.date, 'EEEEE')}
            </span>
            <DayChip cell={c} />
          </div>
        ))}
      </div>
    </>
  );

  if (onOpen) {
    return (
      <button onClick={onOpen} className="card press w-full p-4 text-left">
        {inner}
      </button>
    );
  }

  return <div className="card p-4">{inner}</div>;
}

function DayChip({ cell }: { cell: WeekDayCell }) {
  const ring = cell.isToday ? 'ring-2 ring-coral' : '';
  const base =
    'flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums';

  if (cell.worked) {
    return (
      <span className={`${base} bg-mint text-white ${ring}`}>
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
    );
  }
  if (cell.isRest) {
    return (
      <span className={`${base} bg-black/[0.04] text-neutral-400 dark:bg-white/[0.06] ${ring}`}>
        ·
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-black/[0.04] dark:bg-white/[0.06] ${ring} ${
        cell.inFuture ? 'text-neutral-300 opacity-60 dark:text-neutral-600' : 'text-neutral-500'
      }`}
    >
      {format(cell.date, 'd')}
    </span>
  );
}
