import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns';
import {
  Flame,
  Trophy,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Check,
  Moon,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useStreak } from '../../hooks/useStreak';
import {
  monthMatrix,
  longestStreak,
  totalCompletedWorkouts,
  type CalendarDayCell,
} from '../../lib/stats';
import { fromDayKey } from '../../lib/dates';
import type { DailyLog, Units } from '../../types/app';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Sheet } from '../../components/ios/Sheet';

export function HistoryScreen() {
  const navigate = useNavigate();
  const logs = useAppStore((s) => s.logs);
  const startWeekday = useAppStore((s) => s.settings.startWeekday);
  const units = useAppStore((s) => s.settings.units);
  const streak = useStreak();

  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<string | null>(null);

  const longest = useMemo(() => longestStreak(logs, today), [logs, today]);
  const totalWorkouts = useMemo(() => totalCompletedWorkouts(logs), [logs]);
  const weeks = useMemo(
    () => monthMatrix(logs, viewMonth, today, startWeekday),
    [logs, viewMonth, today, startWeekday],
  );

  const atCurrentMonth = isSameMonth(viewMonth, today);
  const weekdayLabels = weeks[0].map((c) => format(c.date, 'EEEEE'));

  return (
    <div className="min-h-full pb-10">
      <PageHeader title="Streak & History" onBack={() => navigate(-1)} />

      <div className="space-y-6 px-4 pt-2">
        {/* Current-streak hero */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white"
          style={{ backgroundImage: 'linear-gradient(160deg, #FF8A7A 0%, #F2685A 55%, #E2503F 100%)' }}
        >
          <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-1.5 text-white/85">
              <Flame className="h-4 w-4" />
              <span className="text-[13px] font-medium">Current streak</span>
            </div>
            <p className="mt-2 text-[46px] font-extrabold leading-none tabular-nums">
              {streak}
              <span className="ml-2 text-[18px] font-bold text-white/70">
                day{streak === 1 ? '' : 's'}
              </span>
            </p>
            <p className="mt-2 max-w-[16rem] text-[13px] leading-snug text-white/90">
              {streak > 0
                ? 'Nice work — finish a workout today to keep it climbing.'
                : 'Complete a workout today to start a new streak.'}
            </p>
          </div>
        </div>

        {/* Milestones */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            icon={<Trophy className="h-5 w-5" />}
            tint="bg-amber/15 text-amber"
            value={longest}
            label={`Longest streak · day${longest === 1 ? '' : 's'}`}
          />
          <StatTile
            icon={<Dumbbell className="h-5 w-5" />}
            tint="bg-mint/15 text-mint"
            value={totalWorkouts}
            label="Total workouts"
          />
        </div>

        {/* Calendar */}
        <section>
          <SectionHeader title="Calendar" />
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <MonthNavButton
                onClick={() => setViewMonth((m) => subMonths(m, 1))}
                aria="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </MonthNavButton>
              <p className="text-[16px] font-bold">{format(viewMonth, 'MMMM yyyy')}</p>
              <MonthNavButton
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                disabled={atCurrentMonth}
                aria="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </MonthNavButton>
            </div>

            <div className="grid grid-cols-7">
              {weekdayLabels.map((label, i) => (
                <span
                  key={i}
                  className="pb-1.5 text-center text-[11px] font-semibold uppercase text-neutral-400"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weeks.flat().map((cell) => (
                <DayCell key={cell.dayKey} cell={cell} onSelect={setSelected} />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-black/5 pt-3 text-[11px] text-neutral-500 dark:border-white/10 dark:text-neutral-400">
              <LegendDot className="bg-mint" label="Workout" />
              <LegendDot className="bg-mint/25" label="Partial" />
              <LegendDot className="bg-black/[0.06] dark:bg-white/[0.08]" label="Rest" />
            </div>
          </Card>
        </section>

        {/* Explanation */}
        <section>
          <SectionHeader title="How your streak works" />
          <Card className="space-y-3 p-4">
            <Rule
              icon={<Check className="h-4 w-4" strokeWidth={3} />}
              tint="bg-mint/15 text-mint"
              text="Finish a workout and the day is added to your streak."
            />
            <Rule
              icon={<Moon className="h-4 w-4" />}
              tint="bg-lilac-soft text-lilac dark:bg-lilac/20"
              text="Rest days keep your streak alive — they don't break it."
            />
            <Rule
              icon={<RotateCcw className="h-4 w-4" />}
              tint="bg-coral-soft text-coral dark:bg-coral/15"
              text="Skip a scheduled training day and the streak resets to zero."
            />
          </Card>
        </section>
      </div>

      <DayDetailSheet
        dayKey={selected}
        log={selected ? logs[selected] : undefined}
        units={units}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function MonthNavButton({
  children,
  onClick,
  disabled,
  aria,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  aria: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      className="press flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-neutral-600 disabled:opacity-30 dark:bg-white/10 dark:text-neutral-300"
    >
      {children}
    </button>
  );
}

function DayCell({
  cell,
  onSelect,
}: {
  cell: CalendarDayCell;
  onSelect: (dayKey: string) => void;
}) {
  if (!cell.inMonth) return <div className="aspect-square" />;

  const num = format(cell.date, 'd');
  const base =
    'flex aspect-square w-full items-center justify-center rounded-xl text-[13px] font-semibold tabular-nums';
  const ring = cell.isToday ? 'ring-2 ring-coral' : '';

  let tone: string;
  if (cell.worked) tone = 'bg-mint text-white';
  else if (cell.doneSets > 0) tone = 'bg-mint/25 text-mint';
  else if (cell.isRest) tone = 'bg-black/[0.06] text-neutral-400 dark:bg-white/[0.08]';
  else if (cell.inFuture) tone = 'text-neutral-300 dark:text-neutral-600';
  else tone = 'text-neutral-600 dark:text-neutral-300';

  // Future days aren't tappable — there's nothing logged yet.
  if (cell.inFuture) return <div className={`${base} ${tone} ${ring}`}>{num}</div>;

  return (
    <button onClick={() => onSelect(cell.dayKey)} className={`press ${base} ${tone} ${ring}`}>
      {num}
    </button>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-md ${className}`} />
      {label}
    </span>
  );
}

function StatTile({
  icon,
  tint,
  value,
  label,
}: {
  icon: ReactNode;
  tint: string;
  value: number;
  label: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tint}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[22px] font-extrabold leading-none tabular-nums">{value}</p>
        <p className="mt-1 text-[12px] leading-tight text-neutral-500 dark:text-neutral-400">
          {label}
        </p>
      </div>
    </Card>
  );
}

function Rule({ icon, tint, text }: { icon: ReactNode; tint: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tint}`}>
        {icon}
      </div>
      <p className="pt-1 text-[13px] leading-snug text-neutral-600 dark:text-neutral-300">{text}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day detail — the exact workout logged on a tapped date.
// ---------------------------------------------------------------------------

function DayDetailSheet({
  dayKey,
  log,
  units,
  onClose,
}: {
  dayKey: string | null;
  log: DailyLog | undefined;
  units: Units;
  onClose: () => void;
}) {
  const date = dayKey ? fromDayKey(dayKey) : null;
  // The day's plan records each exercise's display name + target muscle; pair it
  // with the logged sets so we can show what was actually performed.
  const metaById = useMemo(
    () => new Map((log?.plan?.exercises ?? []).map((e) => [e.exerciseId, e])),
    [log],
  );

  const doneSets = log
    ? log.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
    : 0;
  const hasWork = !!log && (log.exercises.length > 0 || !!log.completedAt);

  let duration: string | null = null;
  if (log?.startedAt && log?.completedAt) {
    duration = `${Math.max(1, Math.round((log.completedAt - log.startedAt) / 60000))} min`;
  } else if (log?.plan?.estimatedMinutes) {
    duration = `~${log.plan.estimatedMinutes} min`;
  }

  return (
    <Sheet
      open={dayKey != null}
      onClose={onClose}
      title={date ? format(date, 'EEEE, MMMM d') : undefined}
    >
      {!hasWork ? (
        <EmptyDay isRest={log?.status === 'rest'} />
      ) : (
        <div className="space-y-4 pb-2">
          {log?.plan?.splitDayName && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-soft px-3 py-1.5 text-[13px] font-bold text-coral dark:bg-coral/15">
              <Dumbbell className="h-3.5 w-3.5" />
              {log.plan.splitDayName}
            </span>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Metric label="Sets done" value={String(doneSets)} />
            <Metric
              label="Calories"
              value={log?.plan ? log.plan.estimatedCalories.toLocaleString() : '—'}
            />
            <Metric label="Duration" value={duration ?? '—'} />
          </div>

          <div className="space-y-2">
            {log!.exercises.map((le) => {
              const meta = metaById.get(le.exerciseId);
              const name = meta?.name ?? le.exerciseId.replace(/[-_]/g, ' ');
              return (
                <div
                  key={le.exerciseId}
                  className="rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.05]"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[15px] font-bold capitalize leading-tight">{name}</p>
                    <span className="shrink-0 text-[12px] font-semibold text-neutral-400">
                      {le.sets.length} set{le.sets.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {meta?.target && (
                    <p className="text-[12px] capitalize text-neutral-500 dark:text-neutral-400">
                      {meta.target}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {le.sets.map((s, i) => (
                      <span
                        key={i}
                        className={`rounded-lg px-2 py-1 text-[12px] font-semibold tabular-nums ${
                          s.done
                            ? 'bg-mint/15 text-mint'
                            : 'bg-black/5 text-neutral-500 dark:bg-white/10 dark:text-neutral-400'
                        }`}
                      >
                        {s.weight > 0 ? `${s.reps}×${s.weight}${units}` : `${s.reps} reps`}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Sheet>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/[0.03] px-3 py-2.5 dark:bg-white/[0.05]">
      <p className="text-[11px] text-neutral-400">{label}</p>
      <p className="mt-0.5 text-[15px] font-bold tabular-nums">{value}</p>
    </div>
  );
}

function EmptyDay({ isRest }: { isRest: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-black/5 text-neutral-400 dark:bg-white/10">
        {isRest ? <Moon className="h-6 w-6" /> : <Dumbbell className="h-6 w-6" />}
      </div>
      <p className="mt-3 text-[16px] font-bold">{isRest ? 'Rest day' : 'No workout logged'}</p>
      <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
        {isRest
          ? 'Recovery day — no training was scheduled.'
          : "Nothing was recorded on this day."}
      </p>
    </div>
  );
}
