import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ensureSeeded } from '../data/db';
import { generateForDay } from '../engine';
import type { WorkoutPrescription } from '../engine/types';
import { getActiveSplit, nextWorkoutDay, splitDayById, suggestedSplitDay } from '../store/selectors';
import { fromDayKey } from '../lib/dates';
import type { DailyPlan, SplitDay } from '../types/app';

function toPlan(p: WorkoutPrescription): DailyPlan {
  return {
    generatedAt: p.generatedAt,
    goal: p.goal,
    splitDayName: p.splitDayName,
    warmup: p.warmup,
    estimatedMinutes: p.estimatedMinutes,
    estimatedCalories: p.estimatedCalories,
    exercises: p.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      name: e.name,
      target: e.target,
      images: e.images,
      role: e.role,
      sets: e.sets,
      repRangeLow: e.repRangeLow,
      repRangeHigh: e.repRangeHigh,
      restSeconds: e.restSeconds,
      suggestedWeight: e.suggestedWeight,
    })),
  };
}

interface Result {
  plan: DailyPlan | null;
  splitDay: SplitDay | undefined;
  loading: boolean;
  error: string | null;
  regenerate: () => Promise<void>;
  skipRest: () => void;
}

/**
 * The engine drives the day's workout: returns the persisted plan for `dayKey`,
 * auto-generating it the first time a workout day is opened (profile required).
 * `regenerate` rebuilds it on explicit user request.
 */
export function usePrescription(dayKey: string): Result {
  const profile = useAppStore((s) => s.profile);
  const splits = useAppStore((s) => s.splits);
  const activeSplitId = useAppStore((s) => s.settings.activeSplitId);
  const log = useAppStore((s) => s.logs[dayKey]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSplit = getActiveSplit(splits, activeSplitId);
  const splitDay =
    splitDayById(activeSplit, log?.splitDayId ?? null) ??
    suggestedSplitDay(activeSplit, fromDayKey(dayKey));
  const plan = log?.plan ?? null;

  const regenerate = useCallback(async () => {
    // Read fresh state so we always generate against the latest equipment/logs.
    const st = useAppStore.getState();
    const prof = st.profile;
    const split = getActiveSplit(st.splits, st.settings.activeSplitId);
    const lg = st.logs[dayKey];
    const mode = lg?.mode ?? 'home';
    const equipment = lg?.equipment ?? st.settings.defaultEquipment[mode];
    const sd =
      splitDayById(split, lg?.splitDayId ?? null) ??
      suggestedSplitDay(split, fromDayKey(dayKey));
    if (!prof || !sd || sd.isRest) return;

    setLoading(true);
    setError(null);
    try {
      await ensureSeeded();
      const pres = await generateForDay({
        profile: prof,
        splitDay: sd,
        equipment,
        logs: st.logs,
        dayKey,
      });
      st.setPlan(dayKey, toPlan(pres));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate workout');
    } finally {
      setLoading(false);
    }
  }, [dayKey]);

  // Override a suggested rest day with the next workout in the rotation; the
  // auto-generate effect below then builds its plan once the split day updates.
  const skipRest = useCallback(() => {
    const st = useAppStore.getState();
    const split = getActiveSplit(st.splits, st.settings.activeSplitId);
    const next = nextWorkoutDay(split, fromDayKey(dayKey));
    if (!next) return;
    st.setSplitDay(dayKey, next.id);
  }, [dayKey]);

  // Auto-generate when a workout day has no plan yet.
  useEffect(() => {
    if (!plan && profile && splitDay && !splitDay.isRest && !loading) {
      void regenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, profile?.goal, splitDay?.id]);

  return { plan, splitDay, loading, error, regenerate, skipRest };
}
