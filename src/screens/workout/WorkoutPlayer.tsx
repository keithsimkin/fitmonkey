import { useEffect, useMemo, useState } from 'react';
import { X, Pause, Play, Check, Timer } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getLastPerformance } from '../../store/selectors';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { useCountdown } from '../../hooks/useCountdown';
import { formatClock } from '../../lib/format';
import { countdownCue, tickCue, setDoneCue, finishCue } from '../../lib/audioCue';
import { ExerciseGif } from '../../components/exercise/ExerciseGif';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { Stepper } from '../../components/ui/Stepper';
import type { DailyPlan, PlannedExercise, SetEntry, SplitDay } from '../../types/app';
import type { WarmupItem } from '../../engine/types';

type Step =
  | { kind: 'warmup'; item: WarmupItem }
  | { kind: 'set'; ex: PlannedExercise; setIndex: number; totalSets: number }
  | { kind: 'finish' };

const WARMUP_COLOR = '#F4A93C';
const WORK_COLOR = '#1FD0B0';
const REST_COLOR = '#FF6F61';

interface Props {
  dayKey: string;
  plan: DailyPlan;
  splitDay: SplitDay | undefined;
  onExit: () => void;
  onFinish: () => void;
}

/** Flatten the plan into an ordered list of warm-up → per-set → finish steps. */
function buildSteps(plan: DailyPlan): Step[] {
  const steps: Step[] = [];
  plan.warmup.forEach((item) => steps.push({ kind: 'warmup', item }));
  plan.exercises.forEach((ex) => {
    const totalSets = Math.max(1, ex.sets);
    for (let i = 0; i < totalSets; i++) {
      steps.push({ kind: 'set', ex, setIndex: i, totalSets });
    }
  });
  steps.push({ kind: 'finish' });
  return steps;
}

/** Resume position: skip warm-ups once training has begun, land on first undone set. */
function initialIndex(steps: Step[], doneByExercise: Map<string, boolean[]>): number {
  const anyDone = [...doneByExercise.values()].some((arr) => arr.some(Boolean));
  if (!anyDone) return 0;
  const firstIncomplete = steps.findIndex(
    (s) => s.kind === 'set' && !doneByExercise.get(s.ex.exerciseId)?.[s.setIndex],
  );
  return firstIncomplete === -1 ? steps.length - 1 : firstIncomplete;
}

function stepLabel(step: Step | undefined): string | null {
  if (!step) return null;
  if (step.kind === 'warmup') return step.item.label;
  if (step.kind === 'set') return `${step.ex.name} · Set ${step.setIndex + 1}`;
  return 'Finish';
}

export function WorkoutPlayer({ dayKey, plan, splitDay, onExit, onFinish }: Props) {
  const logs = useAppStore((s) => s.logs);
  const units = useAppStore((s) => s.settings.units);
  const setExerciseSets = useAppStore((s) => s.setExerciseSets);
  const startedAt = useAppStore((s) => s.logs[dayKey]?.startedAt);
  const elapsed = useSessionTimer(startedAt);

  const steps = useMemo(() => buildSteps(plan), [plan]);

  const [stepIndex, setStepIndex] = useState(() => {
    const log = useAppStore.getState().logs[dayKey];
    const doneByExercise = new Map<string, boolean[]>();
    (log?.exercises ?? []).forEach((e) => doneByExercise.set(e.exerciseId, e.sets.map((s) => s.done)));
    return initialIndex(steps, doneByExercise);
  });
  const [resting, setResting] = useState(false);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);

  const step = steps[stepIndex];

  const timer = useCountdown({
    onDone: () => {
      // Either a warm-up finished, or a rest between sets finished — advance.
      tickCue(940);
      setResting(false);
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    },
    onTick: (secs) => {
      if (secs <= 3) countdownCue();
    },
  });

  // Entering a warm-up starts its countdown; entering finish plays the fanfare.
  useEffect(() => {
    if (step?.kind === 'warmup') timer.start(step.item.seconds * 1000);
    if (step?.kind === 'finish') finishCue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // Seed the editable reps/weight when a set step becomes active.
  useEffect(() => {
    if (step?.kind !== 'set') return;
    const { ex, setIndex } = step;
    const target = Math.round((ex.repRangeLow + ex.repRangeHigh) / 2);
    const state = useAppStore.getState();
    const logged = state.logs[dayKey]?.exercises
      .find((e) => e.exerciseId === ex.exerciseId)
      ?.sets[setIndex];
    const last = getLastPerformance(state.logs, ex.exerciseId, dayKey)?.sets;
    setReps(logged?.reps ?? target);
    setWeight(logged?.weight ?? ex.suggestedWeight ?? last?.[0]?.weight ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  function advance() {
    setResting(false);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function skipTimer() {
    timer.reset(); // suppress onDone so we don't double-advance
    advance();
  }

  function doneSet() {
    if (step?.kind !== 'set') return;
    const { ex, setIndex, totalSets } = step;
    const target = Math.round((ex.repRangeLow + ex.repRangeHigh) / 2);
    const existing = useAppStore
      .getState()
      .logs[dayKey]?.exercises.find((e) => e.exerciseId === ex.exerciseId)?.sets;
    const next: SetEntry[] = existing
      ? existing.slice()
      : Array.from({ length: totalSets }, () => ({ reps: target, weight, done: false }));
    while (next.length <= setIndex) next.push({ reps: target, weight, done: false });
    next[setIndex] = { reps, weight, done: true };
    setExerciseSets(dayKey, ex.exerciseId, next);
    setDoneCue();

    const isLastSet = !steps.slice(stepIndex + 1).some((s) => s.kind === 'set');
    if (isLastSet) {
      advance(); // → finish
    } else {
      setResting(true);
      timer.start(ex.restSeconds * 1000);
    }
  }

  const summary = useMemo(() => {
    const log = logs[dayKey];
    let sets = 0;
    let exercises = 0;
    (log?.exercises ?? []).forEach((e) => {
      const done = e.sets.filter((s) => s.done).length;
      if (done > 0) {
        sets += done;
        exercises += 1;
      }
    });
    return { sets, exercises };
  }, [logs, dayKey]);

  const progress = steps.length > 1 ? stepIndex / (steps.length - 1) : 1;
  const secs = Math.ceil(timer.remainingMs / 1000);
  const frac = timer.totalMs > 0 ? timer.remainingMs / timer.totalMs : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-app dark:bg-app-dark">
      {/* Top chrome: close + progress + elapsed */}
      <header className="flex items-center gap-3 px-4 pt-safe">
        <button
          onClick={onExit}
          className="press flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-coral transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className="flex items-center gap-1 text-[13px] font-semibold tabular-nums text-neutral-500">
          <Timer className="h-4 w-4" />
          {formatClock(elapsed)}
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-[calc(24px+var(--sab))]">
        {step?.kind === 'warmup' && (
          <>
            <p
              className="mb-6 text-[14px] font-extrabold uppercase tracking-widest"
              style={{ color: WARMUP_COLOR }}
            >
              Warm-up
            </p>
            <ProgressRing value={frac} size={260} stroke={18} color={WARMUP_COLOR}>
              <p className="text-[64px] font-extrabold leading-none tabular-nums">
                {formatClock(secs)}
              </p>
            </ProgressRing>
            <p className="mt-6 max-w-xs text-center text-[16px] font-medium text-neutral-600 dark:text-neutral-300">
              {step.item.label}
            </p>
            <TimerControls
              paused={timer.paused}
              onAdd={() => timer.add(15000)}
              onToggle={() => (timer.paused ? timer.resume() : timer.pause())}
              onSkip={skipTimer}
            />
          </>
        )}

        {step?.kind === 'set' && !resting && (
          <>
            <ExerciseGif images={step.ex.images} alt={step.ex.name} className="h-44 w-44" />
            <p className="mt-4 max-w-xs text-center text-[22px] font-extrabold leading-tight">
              {step.ex.name}
            </p>
            <p className="text-[14px] capitalize text-neutral-500">{step.ex.target}</p>
            <p
              className="mt-4 text-[15px] font-extrabold uppercase tracking-wide"
              style={{ color: WORK_COLOR }}
            >
              Set {step.setIndex + 1} of {step.totalSets}
            </p>
            <p className="mt-1 text-[14px] text-neutral-500">
              Target {step.ex.repRangeLow}-{step.ex.repRangeHigh} reps
            </p>
            <div className="mt-5 flex items-start justify-center gap-10">
              <div className="text-center">
                <p className="mb-1.5 text-[12px] font-medium uppercase text-neutral-400">Reps</p>
                <Stepper value={reps} onChange={setReps} step={1} min={0} />
              </div>
              <div className="text-center">
                <p className="mb-1.5 text-[12px] font-medium uppercase text-neutral-400">
                  Weight ({units})
                </p>
                <Stepper value={weight} onChange={setWeight} step={2.5} min={0} />
              </div>
            </div>
            <button
              onClick={doneSet}
              className="press mt-8 w-full max-w-xs rounded-2xl bg-mint py-4 text-[17px] font-bold text-ink"
            >
              Done set
            </button>
          </>
        )}

        {step?.kind === 'set' && resting && (
          <>
            <p
              className="mb-6 text-[14px] font-extrabold uppercase tracking-widest"
              style={{ color: REST_COLOR }}
            >
              Rest
            </p>
            <ProgressRing value={frac} size={260} stroke={18} color={REST_COLOR}>
              <p className="text-[64px] font-extrabold leading-none tabular-nums">
                {formatClock(secs)}
              </p>
            </ProgressRing>
            {stepLabel(steps[stepIndex + 1]) && (
              <p className="mt-6 max-w-xs text-center text-[15px] text-neutral-500">
                Next: {stepLabel(steps[stepIndex + 1])}
              </p>
            )}
            <TimerControls
              paused={timer.paused}
              onAdd={() => timer.add(15000)}
              onToggle={() => (timer.paused ? timer.resume() : timer.pause())}
              onSkip={skipTimer}
              skipLabel="Skip rest"
            />
          </>
        )}

        {step?.kind === 'finish' && (
          <>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-mint/15 text-mint">
              <Check className="h-12 w-12" strokeWidth={2.5} />
            </div>
            <p className="mt-6 text-center text-[28px] font-extrabold">
              {splitDay?.name ? `${splitDay.name} done 🎉` : 'Workout complete 🎉'}
            </p>
            <p className="mt-2 text-[15px] text-neutral-500">
              {summary.exercises} exercise{summary.exercises === 1 ? '' : 's'} · {summary.sets} set
              {summary.sets === 1 ? '' : 's'} · {formatClock(elapsed)}
            </p>
            <button
              onClick={onFinish}
              className="press mt-10 w-full max-w-xs rounded-2xl bg-coral py-4 text-[17px] font-bold text-white"
            >
              Finish Workout
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function TimerControls({
  paused,
  onAdd,
  onToggle,
  onSkip,
  skipLabel = 'Skip',
}: {
  paused: boolean;
  onAdd: () => void;
  onToggle: () => void;
  onSkip: () => void;
  skipLabel?: string;
}) {
  return (
    <div className="mt-8 flex items-center gap-4">
      <button
        onClick={onAdd}
        className="press flex h-12 items-center justify-center rounded-full bg-black/5 px-4 text-[14px] font-semibold dark:bg-white/10"
      >
        +15s
      </button>
      <button
        onClick={onToggle}
        className="press flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink"
        aria-label={paused ? 'Resume' : 'Pause'}
      >
        {paused ? <Play className="h-7 w-7" /> : <Pause className="h-7 w-7" />}
      </button>
      <button
        onClick={onSkip}
        className="press flex h-12 items-center justify-center rounded-full bg-black/5 px-4 text-[14px] font-semibold dark:bg-white/10"
      >
        {skipLabel}
      </button>
    </div>
  );
}
