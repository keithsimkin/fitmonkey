import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Plus, Check, Timer } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { usePrescription } from '../../hooks/usePrescription';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { isExerciseDone } from '../../store/selectors';
import { ensureSeeded, getExerciseById } from '../../data/db';
import { todayKey } from '../../lib/dates';
import { formatClock, formatRest } from '../../lib/format';
import { startCue } from '../../lib/audioCue';
import { ExerciseGif } from '../../components/exercise/ExerciseGif';
import { ExerciseListSkeleton } from '../../components/ui/Skeleton';
import { RestTimerProvider } from '../../components/timer/RestTimerProvider';
import { ProgressRing } from '../../components/ui/ProgressRing';
import type { Exercise } from '../../types/exercise';
import type { PlannedExercise } from '../../types/app';
import { ExerciseDetailSheet } from './ExerciseDetailSheet';
import { AddExerciseSheet } from './AddExerciseSheet';
import { WorkoutPlayer } from './WorkoutPlayer';

export function WorkoutScreen() {
  return (
    <RestTimerProvider>
      <WorkoutInner />
    </RestTimerProvider>
  );
}

function WorkoutInner() {
  const navigate = useNavigate();
  const key = todayKey();

  const log = useAppStore((s) => s.logs[key]);
  const defaultEquipment = useAppStore((s) => s.settings.defaultEquipment);
  const startSession = useAppStore((s) => s.startSession);
  const completeDay = useAppStore((s) => s.completeDay);

  const { plan, splitDay, loading, regenerate } = usePrescription(key);
  const elapsed = useSessionTimer(log?.startedAt);

  const [selected, setSelected] = useState<{ ex: Exercise; planned?: PlannedExercise } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [exMap, setExMap] = useState<Record<string, Exercise>>({});
  const [playing, setPlaying] = useState(false);

  const plannedIds = useMemo(
    () => new Set((plan?.exercises ?? []).map((e) => e.exerciseId)),
    [plan],
  );
  const extraLogged = useMemo(
    () => (log?.exercises ?? []).filter((e) => !plannedIds.has(e.exerciseId)),
    [log, plannedIds],
  );

  // Load full Exercise records we need (for the detail sheet + extra logged rows).
  useEffect(() => {
    const ids = new Set<string>();
    extraLogged.forEach((e) => ids.add(e.exerciseId));
    const missing = [...ids].filter((id) => !exMap[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      await ensureSeeded();
      const loaded = await Promise.all(missing.map((id) => getExerciseById(id)));
      if (cancelled) return;
      setExMap((m) => {
        const next = { ...m };
        loaded.forEach((ex) => ex && (next[ex.id] = ex));
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [extraLogged, exMap]);

  async function openPlanned(pe: PlannedExercise) {
    const ex = exMap[pe.exerciseId] ?? (await getExerciseById(pe.exerciseId));
    if (ex) {
      setExMap((m) => ({ ...m, [ex.id]: ex }));
      setSelected({ ex, planned: pe });
    }
  }

  const started = !!log?.startedAt;
  const completed = !!log?.completedAt;

  // The session clock (and start cue) begin from this explicit tap, not on mount.
  function beginWorkout() {
    if (!started) startCue();
    startSession(key);
    setPlaying(true);
  }

  const equipment = log?.equipment ?? defaultEquipment[log?.mode ?? 'home'];
  const doneCount = (plan?.exercises ?? []).filter((pe) => isExerciseDone(log, pe.exerciseId)).length;
  const total = plan?.exercises.length ?? 0;
  const ctaLabel = completed ? 'Review Workout' : started ? 'Resume Workout' : 'Start Workout';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-app/80 px-3 pt-safe backdrop-blur-xl dark:bg-app-dark/80">
        <button onClick={() => navigate('/')} className="press flex items-center text-coral">
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[16px]">Home</span>
        </button>
        {started ? (
          <div className="flex items-center gap-1.5 text-[15px] font-semibold tabular-nums text-neutral-500">
            <Timer className="h-4 w-4" />
            {formatClock(elapsed)}
          </div>
        ) : (
          <span />
        )}
        <button
          onClick={() => regenerate()}
          className="press flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
          aria-label="Regenerate workout"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-40">
        {/* Title block */}
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-[30px] font-extrabold tracking-tight">
              {splitDay?.name ?? 'Workout'}
            </h1>
            <p className="text-[14px] text-neutral-500">
              {(splitDay?.bodyParts ?? []).join(' · ')}
              {plan ? ` · ~${plan.estimatedMinutes} min · ${plan.estimatedCalories} kcal` : ''}
            </p>
          </div>
          {total > 0 && (
            <ProgressRing value={doneCount / total} size={56} stroke={6} color="#1FD0B0">
              <span className="text-[12px] font-bold tabular-nums">
                {doneCount}/{total}
              </span>
            </ProgressRing>
          )}
        </div>

        {loading && !plan && (
          <div className="pt-1">
            <p className="mb-3 px-1 text-[13px] text-neutral-500">Building your workout…</p>
            <ExerciseListSkeleton rows={5} />
          </div>
        )}

        {splitDay?.isRest && (
          <p className="py-10 text-center text-neutral-500">
            Today is a rest day in your split. Enjoy the recovery!
          </p>
        )}

        {/* Warmup */}
        {plan && plan.warmup.length > 0 && (
          <div className="card mb-4 p-4">
            <p className="mb-2 text-[13px] font-bold uppercase tracking-wide text-amber">Warm-up</p>
            <div className="space-y-1.5">
              {plan.warmup.map((w, i) => (
                <div key={i} className="flex items-center justify-between text-[14px]">
                  <span>{w.label}</span>
                  <span className="font-semibold text-neutral-500">{formatRest(w.seconds)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Planned exercises */}
        <div className="space-y-3">
          {(plan?.exercises ?? []).map((pe) => (
            <PlanCard
              key={pe.exerciseId}
              planned={pe}
              done={isExerciseDone(log, pe.exerciseId)}
              onClick={() => openPlanned(pe)}
            />
          ))}

          {/* Extra (manually added) exercises */}
          {extraLogged.map((le) => {
            const ex = exMap[le.exerciseId];
            if (!ex) return null;
            const done = isExerciseDone(log, le.exerciseId);
            return (
              <button
                key={le.exerciseId}
                onClick={() => setSelected({ ex })}
                className="card press flex w-full items-center gap-3 p-2.5 text-left"
              >
                <ExerciseGif images={ex.images} alt={ex.name} className="h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold">{ex.name}</p>
                  <p className="text-[13px] text-neutral-500">
                    {le.sets.length} set{le.sets.length === 1 ? '' : 's'} · added
                  </p>
                </div>
                <DoneBadge done={done} />
              </button>
            );
          })}
        </div>

        {/* Add exercise */}
        {!splitDay?.isRest && (
          <button
            onClick={() => setAddOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-black/10 py-3.5 text-[15px] font-semibold text-neutral-500 dark:border-white/15"
          >
            <Plus className="h-4 w-4" /> Add exercise
          </button>
        )}
      </div>

      {/* Start / resume bar */}
      {plan && !splitDay?.isRest && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[calc(12px+var(--sab))]">
          <button
            onClick={beginWorkout}
            className="press w-full max-w-md rounded-2xl bg-coral py-4 text-[17px] font-bold text-white"
          >
            {ctaLabel}
            {!completed && doneCount > 0 ? ` · ${doneCount}/${total} done` : ''}
          </button>
        </div>
      )}

      {playing && plan && (
        <WorkoutPlayer
          dayKey={key}
          plan={plan}
          splitDay={splitDay}
          onExit={() => setPlaying(false)}
          onFinish={() => {
            completeDay(key);
            setPlaying(false);
            navigate('/');
          }}
        />
      )}

      <ExerciseDetailSheet
        exercise={selected?.ex ?? null}
        planned={selected?.planned}
        dayKey={key}
        onClose={() => setSelected(null)}
      />
      <AddExerciseSheet
        open={addOpen}
        bodyParts={splitDay?.bodyParts ?? []}
        equipment={equipment}
        excludeIds={new Set([...plannedIds, ...extraLogged.map((e) => e.exerciseId)])}
        onPick={(ex) => {
          setAddOpen(false);
          setExMap((m) => ({ ...m, [ex.id]: ex }));
          setSelected({ ex });
        }}
        onClose={() => setAddOpen(false)}
      />
    </div>
  );
}

function PlanCard({
  planned,
  done,
  onClick,
}: {
  planned: PlannedExercise;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="card press flex w-full items-center gap-3 p-2.5 text-left">
      <ExerciseGif images={planned.images} alt={planned.name} className="h-16 w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold">{planned.name}</p>
        <p className="mt-0.5 truncate text-[13px] capitalize text-neutral-500">{planned.target}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-coral">
          {planned.sets} × {planned.repRangeLow}-{planned.repRangeHigh} · {formatRest(planned.restSeconds)} rest
        </p>
      </div>
      <DoneBadge done={done} />
    </button>
  );
}

function DoneBadge({ done }: { done: boolean }) {
  return done ? (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint text-white">
      <Check className="h-4 w-4" strokeWidth={3} />
    </span>
  ) : (
    <span className="h-6 w-6 shrink-0 rounded-full border-2 border-neutral-200 dark:border-neutral-700" />
  );
}
