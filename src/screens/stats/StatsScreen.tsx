import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Plus, Flame, Dumbbell, CalendarCheck, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useStreak } from '../../hooks/useStreak';
import { SegmentedControl } from '../../components/ios/SegmentedControl';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Card } from '../../components/ui/Card';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { BarChart, type Bar } from '../../components/ui/BarChart';
import { Sheet } from '../../components/ios/Sheet';
import {
  latestWeightKg,
  weightDeltaKg,
  monthlyBuckets,
  recentBuckets,
  weeklyVolume,
  weeklyTargetSets,
  totalWeeklySets,
  totalCompletedWorkouts,
  workoutsInLastDays,
  consistencyGrid,
  MUSCLE_GROUPS,
  type MuscleGroup,
  type HeatCell,
} from '../../lib/stats';
import { kgToDisplay, displayToKg } from '../../lib/units';
import { todayKey } from '../../lib/dates';

type Period = 'weekly' | 'monthly';

const GROUP_COLOR: Record<MuscleGroup, string> = {
  Chest: '#FF6F61',
  Back: '#B7A6F3',
  Shoulders: '#4F9FE6',
  Arms: '#F4A93C',
  Legs: '#1FD0B0',
  Core: '#FF8A7A',
};

// Heatmap fill ramp, keyed off the brand coral.
const CORAL_RGB = '255, 111, 97';
const HEAT_ALPHA = [0, 0.3, 0.5, 0.72, 1];

function heatStyle(level: number): CSSProperties {
  const a = HEAT_ALPHA[level] ?? 1;
  return a > 0 ? { backgroundColor: `rgba(${CORAL_RGB}, ${a})` } : {};
}

export function StatsScreen() {
  const weightLog = useAppStore((s) => s.weightLog);
  const logs = useAppStore((s) => s.logs);
  const units = useAppStore((s) => s.settings.units);
  const startWeekday = useAppStore((s) => s.settings.startWeekday);
  const experience = useAppStore((s) => s.profile?.experience ?? 'beginner');
  const streak = useStreak();

  const [period, setPeriod] = useState<Period>('monthly');
  const [logOpen, setLogOpen] = useState(false);

  const today = useMemo(() => new Date(), []);
  const weightKg = latestWeightKg(weightLog);
  const deltaKg = weightDeltaKg(weightLog);
  const changeKg =
    weightKg != null && weightLog.length > 0 ? weightKg - weightLog[0].kg : undefined;

  const buckets = period === 'monthly'
    ? monthlyBuckets(weightLog, today, 7)
    : recentBuckets(weightLog, 7);
  const bars: Bar[] = buckets.map((b, i) => ({
    label: b.label,
    value: b.value > 0 ? kgToDisplay(b.value, units) : 0,
    highlight: i === buckets.length - 1 && b.value > 0,
    badge: i === buckets.length - 1 && b.value > 0 ? `${kgToDisplay(b.value, units).toFixed(0)}` : undefined,
  }));

  const volume = useMemo(() => weeklyVolume(logs, today), [logs, today]);
  const target = weeklyTargetSets(experience);
  const totalSets = totalWeeklySets(volume);
  const totalTarget = target * MUSCLE_GROUPS.length;
  const volumeFraction = totalTarget > 0 ? Math.min(1, totalSets / totalTarget) : 0;

  const totalWorkouts = useMemo(() => totalCompletedWorkouts(logs), [logs]);
  const weekWorkouts = useMemo(() => workoutsInLastDays(logs, today, 7), [logs, today]);
  const grid = useMemo(
    () => consistencyGrid(logs, today, 12, startWeekday),
    [logs, today, startWeekday],
  );
  const tKey = todayKey();

  return (
    <div className="space-y-7 pb-4 pt-3">
      <div className="px-5">
        <h1 className="text-[32px] font-extrabold tracking-tight">Statistics</h1>
        <p className="mt-0.5 text-[14px] text-neutral-500 dark:text-neutral-400">
          Your progress at a glance
        </p>
      </div>

      {/* Current weight hero */}
      <div className="px-4">
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white"
          style={{
            background:
              'radial-gradient(130% 90% at 100% 0%, rgba(31,208,176,0.22), rgba(31,208,176,0) 55%), linear-gradient(160deg, #1b1c23, #0e0f12)',
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-white/55">
              <Scale className="h-4 w-4" />
              <span className="text-[13px] font-medium">Current Weight</span>
            </div>
            <div className="w-[132px] shrink-0">
              <SegmentedControl<Period>
                value={period}
                onChange={setPeriod}
                options={[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ]}
              />
            </div>
          </div>

          {/* Weight + trend chip */}
          <div className="mt-3 flex items-end gap-2.5">
            <p className="text-[46px] font-extrabold leading-none tracking-tight">
              {weightKg != null ? kgToDisplay(weightKg, units).toFixed(1) : '—'}
              <span className="ml-1 text-[18px] font-bold text-white/55">{units}</span>
            </p>
            {deltaKg != null && (
              <span
                className={`mb-1.5 inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[12px] font-bold ${
                  deltaKg <= 0 ? 'bg-mint/20 text-mint' : 'bg-white/10 text-white/80'
                }`}
              >
                {deltaKg <= 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5" />
                )}
                {Math.abs(kgToDisplay(deltaKg, units)).toFixed(1)}
              </span>
            )}
          </div>

          {/* Mini stats */}
          {weightLog.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Start', value: kgToDisplay(weightLog[0].kg, units).toFixed(1), accent: false },
                {
                  label: 'Change',
                  value:
                    changeKg != null
                      ? `${changeKg >= 0 ? '+' : ''}${kgToDisplay(changeKg, units).toFixed(1)}`
                      : '—',
                  accent: changeKg != null && changeKg < 0,
                },
                { label: 'Entries', value: String(weightLog.length), accent: false },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/[0.05] px-3 py-2">
                  <p className="text-[11px] text-white/45">{s.label}</p>
                  <p className={`text-[15px] font-bold tabular-nums ${s.accent ? 'text-mint' : 'text-white'}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Chart panel */}
          <div className="mt-4 rounded-3xl bg-white/[0.05] p-3">
            {weightLog.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                <Scale className="h-7 w-7 text-white/25" />
                <p className="text-[14px] font-medium text-white/60">No weigh-ins yet</p>
                <p className="text-[12px] text-white/35">Log your weight to see your trend.</p>
              </div>
            ) : (
              <BarChart bars={bars} color="#1FD0B0" height={128} />
            )}
          </div>

          {/* Log weight */}
          <button
            onClick={() => setLogOpen(true)}
            className="press mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-mint py-3 text-[15px] font-bold text-ink"
          >
            <Plus className="h-4 w-4" /> Log weight
          </button>
        </div>
      </div>

      {/* Quick summary tiles */}
      <section className="px-4">
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            icon={<Flame className="h-5 w-5" />}
            tint="bg-coral-soft text-coral dark:bg-coral/15"
            value={streak}
            label="Day streak"
          />
          <StatTile
            icon={<Dumbbell className="h-5 w-5" />}
            tint="bg-mint/15 text-mint"
            value={totalWorkouts}
            label="Workouts"
          />
          <StatTile
            icon={<CalendarCheck className="h-5 w-5" />}
            tint="bg-lilac-soft text-lilac dark:bg-lilac/20"
            value={weekWorkouts}
            label="This week"
          />
        </div>
      </section>

      {/* This week — training volume + per-muscle rings */}
      <section className="px-4">
        <SectionHeader title="This Week" />
        <Card className="p-5">
          <div className="flex items-center gap-5">
            <ProgressRing value={volumeFraction} size={88} stroke={9} color="#FF6F61">
              <div className="text-center leading-none">
                <p className="text-[20px] font-extrabold tabular-nums">{totalSets}</p>
                <p className="mt-0.5 text-[10px] font-medium text-neutral-400">sets</p>
              </div>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">Training volume</p>
              <p className="mt-1 text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
                {totalSets} of {totalTarget} target sets across all muscle groups.
              </p>
              <p className="mt-2 text-[12px] font-semibold text-coral">
                {weekWorkouts} workout{weekWorkouts === 1 ? '' : 's'} this week
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5 border-t border-black/5 pt-5 dark:border-white/10">
            {MUSCLE_GROUPS.map((g) => {
              const sets = volume[g];
              const fraction = Math.min(1, sets / target);
              return (
                <div key={g} className="flex flex-col items-center gap-1.5">
                  <ProgressRing value={fraction} size={56} stroke={6} color={GROUP_COLOR[g]}>
                    <span className="text-[13px] font-extrabold tabular-nums">{sets}</span>
                  </ProgressRing>
                  <div className="text-center leading-none">
                    <p className="text-[12px] font-semibold">{g}</p>
                    <p className="mt-0.5 text-[10px] text-neutral-400">of {target}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Consistency heatmap */}
      <section className="px-4">
        <SectionHeader title="Consistency" />
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400">Last 12 weeks</p>
            <div className="flex items-center gap-1 text-[10px] text-neutral-400">
              <span>Less</span>
              {HEAT_ALPHA.map((_, l) => (
                <span
                  key={l}
                  className={`inline-block h-2.5 w-2.5 rounded-[3px] ${
                    l === 0 ? 'bg-black/[0.06] dark:bg-white/[0.08]' : ''
                  }`}
                  style={heatStyle(l)}
                />
              ))}
              <span>More</span>
            </div>
          </div>

          <div className="mt-4 flex gap-1">
            {grid.map((col, ci) => (
              <div key={ci} className="flex flex-1 flex-col gap-1">
                {col.map((cell) => (
                  <HeatSquare key={cell.dayKey} cell={cell} isToday={cell.dayKey === tKey} />
                ))}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <LogWeightSheet open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
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
    <Card className="flex flex-col gap-3 p-3.5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${tint}`}>{icon}</div>
      <div>
        <p className="text-[22px] font-extrabold leading-none tabular-nums">{value}</p>
        <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">{label}</p>
      </div>
    </Card>
  );
}

function HeatSquare({ cell, isToday }: { cell: HeatCell; isToday: boolean }) {
  const empty =
    cell.level <= 0
      ? cell.inFuture
        ? 'bg-transparent'
        : 'bg-black/[0.06] dark:bg-white/[0.08]'
      : '';
  const ring = isToday ? 'ring-2 ring-ink/30 dark:ring-white/40' : '';
  return (
    <div
      className={`aspect-square rounded-[4px] ${empty} ${ring}`}
      style={heatStyle(cell.level)}
    />
  );
}

function LogWeightSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const units = useAppStore((s) => s.settings.units);
  const logWeight = useAppStore((s) => s.logWeight);
  const latest = useAppStore((s) => latestWeightKg(s.weightLog));
  const [value, setValue] = useState('');

  function save() {
    const n = parseFloat(value);
    if (Number.isFinite(n) && n > 0) {
      logWeight(displayToKg(n, units));
      setValue('');
      onClose();
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log weight"
      action={
        <button onClick={save} className="text-[17px] font-semibold text-coral">
          Save
        </button>
      }
    >
      <div className="space-y-3 pb-2">
        <div className="flex items-center rounded-2xl bg-black/5 px-4 dark:bg-white/10">
          <input
            autoFocus
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={latest != null ? kgToDisplay(latest, units).toFixed(1) : '0.0'}
            className="w-full bg-transparent py-4 text-[22px] font-bold outline-none placeholder:text-neutral-400"
          />
          <span className="text-[15px] font-semibold text-neutral-400">{units}</span>
        </div>
        <p className="px-1 text-[12px] text-neutral-400">Saved against today's date.</p>
      </div>
    </Sheet>
  );
}
