import { useEffect, useMemo } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getLastPerformance } from '../../store/selectors';
import { useRestTimer } from '../../components/timer/restContext';
import { setDoneCue } from '../../lib/audioCue';
import { formatRest } from '../../lib/format';
import type { PlannedExercise, SetEntry } from '../../types/app';

interface Props {
  dayKey: string;
  exerciseId: string;
  planned?: PlannedExercise;
}

const DEFAULT_REST = 60;

export function SetLogger({ dayKey, exerciseId, planned }: Props) {
  const units = useAppStore((s) => s.settings.units);
  const logs = useAppStore((s) => s.logs);
  const setExerciseSets = useAppStore((s) => s.setExerciseSets);
  const { startRest } = useRestTimer();

  const current = logs[dayKey]?.exercises.find((e) => e.exerciseId === exerciseId);
  const sets = current?.sets ?? [];

  const lastSets = useMemo(
    () => getLastPerformance(logs, exerciseId, dayKey)?.sets,
    [logs, exerciseId, dayKey],
  );

  const restSeconds = planned?.restSeconds ?? DEFAULT_REST;
  const targetReps = planned ? Math.round((planned.repRangeLow + planned.repRangeHigh) / 2) : undefined;
  const targetWeight = planned?.suggestedWeight ?? lastSets?.[0]?.weight ?? 0;

  // Seed the prescribed sets the first time this exercise is opened.
  useEffect(() => {
    if (!current && planned && targetReps != null) {
      setExerciseSets(
        dayKey,
        exerciseId,
        Array.from({ length: planned.sets }, () => ({
          reps: targetReps,
          weight: targetWeight,
          done: false,
        })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  function update(next: SetEntry[]) {
    setExerciseSets(dayKey, exerciseId, next);
  }

  function addSet() {
    const template =
      sets[sets.length - 1] ??
      lastSets?.[0] ?? { reps: targetReps ?? 10, weight: targetWeight };
    update([...sets, { reps: template.reps, weight: template.weight, done: false }]);
  }

  function patch(i: number, p: Partial<SetEntry>) {
    update(sets.map((s, idx) => (idx === i ? { ...s, ...p } : s)));
  }

  function toggleDone(i: number) {
    const wasDone = sets[i].done;
    patch(i, { done: !wasDone });
    if (!wasDone) {
      setDoneCue(); // confirmation pop (also unlocks audio for the rest timer)
      startRest(restSeconds); // auto-start engine-prescribed rest
    }
  }

  function remove(i: number) {
    update(sets.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-[15px] font-semibold">Sets</h4>
        {planned ? (
          <span className="text-[12px] font-medium text-neutral-500">
            Target: {planned.sets} × {planned.repRangeLow}-{planned.repRangeHigh} · rest{' '}
            {formatRest(restSeconds)}
          </span>
        ) : (
          lastSets &&
          sets.length === 0 && (
            <span className="text-[12px] text-neutral-500">
              Last: {lastSets.length} × {lastSets[0].reps}
              {lastSets[0].weight ? ` @ ${lastSets[0].weight}${units}` : ''}
            </span>
          )
        )}
      </div>

      {sets.length > 0 && (
        <div className="mb-2 overflow-hidden rounded-2xl bg-black/[0.03] dark:bg-white/[0.04]">
          <div className="flex items-center px-4 py-2 text-[12px] font-medium uppercase tracking-wide text-neutral-500">
            <span className="w-8">Set</span>
            <span className="flex-1 text-center">Reps</span>
            <span className="flex-1 text-center">Weight ({units})</span>
            <span className="w-12 text-right">Done</span>
          </div>
          {sets.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-1 border-t border-black/5 px-4 py-2 dark:border-white/10"
            >
              <span className="w-8 text-[15px] text-neutral-500">{i + 1}</span>
              <Stepper value={s.reps} onChange={(v) => patch(i, { reps: v })} step={1} min={0} />
              <Stepper value={s.weight} onChange={(v) => patch(i, { weight: v })} step={2.5} min={0} />
              <div className="flex w-12 items-center justify-end gap-2">
                <button
                  onClick={() => toggleDone(i)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    s.done ? 'border-mint bg-mint text-white' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                >
                  {s.done && <span className="text-xs">✓</span>}
                </button>
              </div>
              <button
                onClick={() => remove(i)}
                className="ml-1 text-neutral-300 active:text-coral dark:text-neutral-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addSet}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-coral/10 py-3 text-[15px] font-semibold text-coral"
      >
        <Plus className="h-4 w-4" /> Add Set
      </button>
    </div>
  );
}

function Stepper({
  value,
  onChange,
  step,
  min,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
}) {
  return (
    <div className="flex flex-1 items-center justify-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[2.5rem] text-center text-[16px] font-semibold tabular-nums">
        {value}
      </span>
      <button
        onClick={() => onChange(+(value + step).toFixed(2))}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
