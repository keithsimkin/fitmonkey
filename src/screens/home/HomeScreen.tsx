import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Scale, Timer, Sparkles, ChevronRight, Dumbbell } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { usePrescription } from '../../hooks/usePrescription';
import { useStreak } from '../../hooks/useStreak';
import { useNotifications } from '../../hooks/useNotifications';
import { planProgress } from '../../store/selectors';
import { latestWeightKg, weightDeltaKg } from '../../lib/stats';
import { kgToDisplay } from '../../lib/units';
import { todayKey } from '../../lib/dates';
import { GreetingHeader } from '../../components/ui/GreetingHeader';
import { WeekStreak } from '../../components/ui/WeekStreak';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatRow } from '../../components/ui/StatRow';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { Skeleton } from '../../components/ui/Skeleton';
import { SegmentedControl } from '../../components/ios/SegmentedControl';
import type { DayMode } from '../../types/app';

// Vertical accent bars on each activity row (orange / teal / blue / lilac / coral).
const ACTIVITY_BAR_COLORS = ['#F4A93C', '#1FD0B0', '#5B8DEF', '#B7A6F3', '#FF6F61'];

export function HomeScreen() {
  const navigate = useNavigate();
  const key = todayKey();

  const profile = useAppStore((s) => s.profile);
  const log = useAppStore((s) => s.logs[key]);
  const logs = useAppStore((s) => s.logs);
  const weightLog = useAppStore((s) => s.weightLog);
  const units = useAppStore((s) => s.settings.units);
  const startWeekday = useAppStore((s) => s.settings.startWeekday);
  const setMode = useAppStore((s) => s.setMode);
  const streak = useStreak();
  const { unreadCount } = useNotifications();

  const { plan, splitDay, loading, regenerate, skipRest } = usePrescription(key);
  const progress = useMemo(() => planProgress(log), [log]);

  const mode: DayMode = log?.mode ?? 'home';

  // Picking Home vs Gym reseeds the day's equipment (gym = everything, home =
  // your kit) and rebuilds the plan so the exercises match where you're training.
  function changeMode(next: DayMode) {
    if (next === mode) return;
    setMode(key, next);
    void regenerate();
  }

  const weightKg = latestWeightKg(weightLog);
  const deltaKg = weightDeltaKg(weightLog);

  function startWorkout() {
    // Open the workout screen; the session clock and start cue now begin from
    // the explicit Start button there (so the elapsed time reflects real work).
    navigate('/workout');
  }

  return (
    <div className="space-y-7 px-4 pb-4 pt-2">
      <GreetingHeader
        name={profile?.name ?? ''}
        badgeCount={unreadCount}
        onAvatar={() => navigate('/profile')}
        onBell={() => navigate('/notifications')}
      />

      <WeekStreak
        logs={logs}
        weekStartsOn={startWeekday}
        streak={streak}
        onOpen={() => navigate('/history')}
      />

      {profile && !splitDay?.isRest && (
        <div className="-mb-2 flex items-center justify-between gap-3">
          <p className="text-[14px] font-semibold text-neutral-500 dark:text-neutral-400">
            Training at
          </p>
          <div className="w-48">
            <SegmentedControl<DayMode>
              value={mode}
              onChange={changeMode}
              options={[
                { value: 'home', label: 'Home' },
                { value: 'gym', label: 'Gym' },
              ]}
            />
          </div>
        </div>
      )}

      {!profile ? (
        <OnboardingCard onStart={() => navigate('/profile')} />
      ) : splitDay?.isRest ? (
        <RestCard streak={streak} onSkip={skipRest} />
      ) : (
        <ProgressHero
          fraction={progress.total ? progress.fraction : 0}
          left={progress.total ? progress.total - progress.done : plan?.exercises.length ?? 0}
          loading={loading && !plan}
          onStart={startWorkout}
        />
      )}

      {/* Today's Activity — skeleton while the engine builds the plan */}
      {profile && !plan && loading && !splitDay?.isRest && (
        <section>
          <SectionHeader title="Today's Activity" />
          <Card className="overflow-hidden">
            <div className="flex items-stretch gap-3 p-3">
              <Skeleton className="h-32 w-28 shrink-0 rounded-3xl" />
              <div className="min-w-0 flex-1 space-y-3 py-1">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-1.5 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Today's Activity */}
      {profile && plan && !splitDay?.isRest && (
        <section>
          <SectionHeader title="Today's Activity" actionLabel="Edit" onAction={startWorkout} />
          <Card className="overflow-hidden">
            <div className="flex items-stretch gap-3 p-3">
              <div
                className="relative flex w-28 shrink-0 flex-col overflow-hidden rounded-3xl p-4 text-white"
                style={{ backgroundImage: 'linear-gradient(180deg, #FF8A7A 0%, #F2685A 55%, #E2503F 100%)' }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
                  <Dumbbell className="h-5 w-5" />
                </div>
                {/* Decorative wave at the foot of the tile. */}
                <div className="pointer-events-none absolute -inset-x-2 bottom-0 h-20 rounded-[100%] bg-white/10" />
                <div className="relative mt-auto pt-6">
                  <p className="text-[22px] font-extrabold leading-none tabular-nums">
                    {plan.estimatedCalories.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[12px] font-medium text-white/85">Calories</p>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                {plan.exercises.slice(0, 4).map((ex, i) => (
                  <div
                    key={ex.exerciseId}
                    className="flex items-center gap-3 border-b border-black/5 py-2.5 last:border-0 dark:border-white/10"
                  >
                    <span
                      className="h-9 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: ACTIVITY_BAR_COLORS[i % ACTIVITY_BAR_COLORS.length] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold leading-tight">{ex.name}</p>
                      <p className="truncate text-[12px] capitalize text-neutral-500 dark:text-neutral-400">
                        {ex.target}
                      </p>
                    </div>
                    <p className="shrink-0 whitespace-nowrap tabular-nums">
                      <span className="text-[15px] font-bold">
                        {ex.repRangeLow}-{ex.repRangeHigh}
                      </span>
                      <span className="ml-0.5 text-[12px] font-semibold text-neutral-400">
                        ×{ex.sets}
                      </span>
                    </p>
                  </div>
                ))}
                {plan.exercises.length > 4 && (
                  <p className="pt-2 text-[12px] font-medium text-neutral-400">
                    +{plan.exercises.length - 4} more
                  </p>
                )}
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Overall Status */}
      {profile && (
        <section>
          <SectionHeader
            title="Overall Status"
            actionLabel="See more"
            onAction={() => navigate('/stats')}
          />
          <Card className="divide-y divide-black/5 dark:divide-white/10">
            <StatRow
              icon={<Flame className="h-5 w-5" />}
              iconClassName="bg-coral-soft text-coral"
              title="Workout calories"
              value={`${plan?.estimatedCalories ?? 0} kcal`}
              percent={progress.total ? progress.fraction : 0}
              ringColor="#FF6F61"
            />
            <StatRow
              icon={<Scale className="h-5 w-5" />}
              iconClassName="bg-mint/15 text-mint"
              title="Current weight"
              value={weightKg != null ? `${kgToDisplay(weightKg, units).toFixed(1)} ${units}` : '— '}
              delta={
                deltaKg != null
                  ? `${deltaKg >= 0 ? '+' : ''}${kgToDisplay(deltaKg, units).toFixed(1)}`
                  : undefined
              }
              ringColor="#1FD0B0"
            />
          </Card>
        </section>
      )}

      {/* Tools */}
      <section>
        <SectionHeader title="Tools" />
        <div className="grid grid-cols-2 gap-3">
          <Card className="press flex items-center gap-3 p-4" onClick={() => navigate('/timer')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lilac-soft text-lilac dark:bg-lilac/20">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-bold">Interval Timer</p>
              <p className="text-[12px] text-neutral-500">Tabata · EMOM</p>
            </div>
          </Card>
          <Card className="press flex items-center gap-3 p-4" onClick={() => navigate('/discover')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-peach-soft text-amber dark:bg-amber/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-bold">Discover</p>
              <p className="text-[12px] text-neutral-500">Browse moves</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function ProgressHero({
  fraction,
  left,
  loading,
  onStart,
}: {
  fraction: number;
  left: number;
  loading: boolean;
  onStart: () => void;
}) {
  const subtitle = loading
    ? 'Building your workout…'
    : left > 0
      ? `${left} Exercise${left === 1 ? '' : 's'} left`
      : 'All done — great work!';

  return (
    <button
      onClick={onStart}
      className="press relative w-full overflow-hidden rounded-2xl bg-ink px-6 py-5 text-left text-white"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[22px] font-extrabold leading-tight">Workout Progress</p>
          <p className="mt-1.5 text-[14px] text-white/55">{subtitle}</p>
        </div>
        <ProgressRing value={fraction} size={84} stroke={9} color="#1FD0B0">
          <span className="text-[19px] font-extrabold tabular-nums">
            {Math.round(fraction * 100)}%
          </span>
        </ProgressRing>
      </div>
    </button>
  );
}

function RestCard({ streak, onSkip }: { streak: number; onSkip: () => void }) {
  return (
    <div className="rounded-2xl bg-mint p-5 text-white">
      <p className="text-[13px] font-medium text-white/80">Today</p>
      <p className="mt-1 text-[26px] font-extrabold">Rest Day 😌</p>
      <p className="mt-1 text-[14px] text-white/85">
        Recovery is part of the plan. {streak > 0 ? `${streak}-day streak kept alive.` : ''}
      </p>
      <button
        onClick={onSkip}
        className="press mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-[14px] font-bold text-mint"
      >
        <Dumbbell className="h-4 w-4" /> Skip &amp; train instead
      </button>
    </div>
  );
}

function OnboardingCard({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="press w-full overflow-hidden rounded-2xl bg-coral p-5 text-left text-white"
    >
      <Sparkles className="h-7 w-7" />
      <p className="mt-3 text-[22px] font-extrabold leading-tight">Set up your coach</p>
      <p className="mt-1 text-[14px] text-white/85">
        Tell us your goals and details — we'll build your workouts automatically, on device.
      </p>
      <span className="mt-4 inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-[14px] font-bold text-coral">
        Get started <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}
