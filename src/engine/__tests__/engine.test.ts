import { test, expect } from 'bun:test';
import type { Exercise } from '../../types/exercise';
import type { LoggedExercise } from '../../types/app';
import type { PrescribedExercise, UserProfile } from '../types';
import { classifyRole } from '../classify';
import { selectExercises } from '../select';
import { fitToBudget, exerciseSeconds } from '../budget';
import { progressSets } from '../progression';
import { buildPhases, totalSeconds, INTERVAL_PRESETS } from '../interval';
import { recommendSplitId, resolveActiveSplitId } from '../splitSelection';
import { SCHEMES } from '../schemes';
import { buildPrescription } from '../index';

function ex(p: Partial<Exercise> & { id: string; name: string }): Exercise {
  return {
    id: p.id,
    name: p.name,
    bodyPart: p.bodyPart ?? 'Chest',
    equipment: p.equipment ?? 'Body Weight',
    muscleGroup: p.muscleGroup ?? '',
    target: p.target ?? 'pectorals',
    secondary: p.secondary ?? [],
    images: p.images ?? ['a.jpg', 'b.jpg'],
    instructions: p.instructions ?? '',
  };
}

function pres(p: Partial<PrescribedExercise>): PrescribedExercise {
  return {
    exerciseId: 'e',
    name: 'E',
    bodyPart: 'Chest',
    target: 'pectorals',
    equipment: 'Barbell',
    images: ['a.jpg', 'b.jpg'],
    role: 'compound',
    sets: 3,
    repRangeLow: 6,
    repRangeHigh: 10,
    restSeconds: 90,
    order: 0,
    ...p,
  };
}

// --- classify -------------------------------------------------------------
test('classifyRole: big lifts are compound', () => {
  expect(classifyRole(ex({ id: '1', name: 'Barbell Squat', target: 'quads', equipment: 'Barbell', secondary: ['glutes', 'hamstrings'] }))).toBe('compound');
  expect(classifyRole(ex({ id: '2', name: 'Bench Press', target: 'pectorals', equipment: 'Barbell', secondary: ['triceps', 'delts'] }))).toBe('compound');
  expect(classifyRole(ex({ id: '3', name: 'Bent Over Row', target: 'upper back', equipment: 'Barbell', secondary: ['lats', 'biceps'] }))).toBe('compound');
});

test('classifyRole: single-joint moves are isolation', () => {
  expect(classifyRole(ex({ id: '4', name: 'Biceps Curl', target: 'biceps', equipment: 'Dumbbell', secondary: ['forearms'] }))).toBe('isolation');
  expect(classifyRole(ex({ id: '5', name: 'Calf Raise', target: 'calves', equipment: 'Dumbbell' }))).toBe('isolation');
  expect(classifyRole(ex({ id: '6', name: 'Lateral Raise', target: 'delts', equipment: 'Dumbbell', secondary: ['traps'] }))).toBe('isolation');
});

// --- split selection ------------------------------------------------------
test('recommendSplitId maps days/week to built-in splits', () => {
  expect(recommendSplitId(2)).toBe('split-full-body');
  expect(recommendSplitId(3)).toBe('split-full-body');
  expect(recommendSplitId(4)).toBe('split-upper-lower');
  expect(recommendSplitId(6)).toBe('split-ppl');
});

test('resolveActiveSplitId honors an explicit choice, else recommends', () => {
  const ids = ['split-ppl', 'split-upper-lower', 'split-full-body', 'split-bro'];
  // explicit, still-available split wins
  expect(resolveActiveSplitId('split-bro', 3, ids)).toBe('split-bro');
  // 'auto' / unset fall back to the frequency recommendation
  expect(resolveActiveSplitId('auto', 3, ids)).toBe('split-full-body');
  expect(resolveActiveSplitId(undefined, 4, ids)).toBe('split-upper-lower');
  // a deleted / unknown preference also falls back
  expect(resolveActiveSplitId('split-gone', 6, ids)).toBe('split-ppl');
});

// --- selection ------------------------------------------------------------
test('selectExercises orders compounds first and respects body parts', () => {
  const candidates = [
    ex({ id: 'curl', name: 'Cable Curl', bodyPart: 'Upper Arms', target: 'biceps', equipment: 'Cable' }),
    ex({ id: 'press', name: 'Bench Press', bodyPart: 'Chest', target: 'pectorals', equipment: 'Barbell', secondary: ['triceps', 'delts'] }),
    ex({ id: 'fly', name: 'Cable Fly', bodyPart: 'Chest', target: 'pectorals', equipment: 'Cable' }),
  ];
  const out = selectExercises({
    candidates,
    bodyParts: ['Chest', 'Upper Arms'],
    scheme: SCHEMES.hypertrophy,
    experience: 'intermediate',
    injuries: [],
  });
  expect(out.length).toBe(3);
  expect(out[0].role).toBe('compound');
  expect(out[0].exerciseId).toBe('press');
});

test('selectExercises drops injury-excluded moves', () => {
  const candidates = [
    ex({ id: 'dl', name: 'Deadlift', bodyPart: 'Back', target: 'spine', equipment: 'Barbell' }),
    ex({ id: 'row', name: 'Seated Row', bodyPart: 'Back', target: 'lats', equipment: 'Cable' }),
  ];
  const out = selectExercises({
    candidates,
    bodyParts: ['Back'],
    scheme: SCHEMES.strength,
    experience: 'beginner',
    injuries: ['lowerBack'],
  });
  expect(out.find((e) => e.exerciseId === 'dl')).toBeUndefined();
  expect(out.find((e) => e.exerciseId === 'row')).toBeDefined();
});

// --- budget ---------------------------------------------------------------
test('fitToBudget keeps a floor even when over budget', () => {
  const list = Array.from({ length: 8 }, (_, i) => pres({ exerciseId: `e${i}`, sets: 4, restSeconds: 120 }));
  const { exercises } = fitToBudget(list, 10, 300); // tiny budget
  expect(exercises.length).toBeGreaterThanOrEqual(3);
});

test('fitToBudget includes more when there is time', () => {
  const list = Array.from({ length: 6 }, (_, i) => pres({ exerciseId: `e${i}`, sets: 3, restSeconds: 60 }));
  const big = fitToBudget(list, 120, 300);
  expect(big.exercises.length).toBe(6);
  expect(big.estimatedMinutes).toBeGreaterThan(0);
  expect(exerciseSeconds(list[0])).toBe(3 * (40 + 60));
});

// --- progression ----------------------------------------------------------
function logged(sets: { reps: number; weight: number; done?: boolean }[]): LoggedExercise {
  return { exerciseId: 'e', sets: sets.map((s) => ({ ...s, done: s.done ?? true })) };
}

test('progressSets: no history → midpoint at bodyweight', () => {
  const out = progressSets(pres({ repRangeLow: 6, repRangeHigh: 10, sets: 3 }), undefined);
  expect(out).toHaveLength(3);
  expect(out[0]).toEqual({ reps: 8, weight: 0 });
});

test('progressSets: hitting top of range adds weight, resets reps', () => {
  const last = logged([{ reps: 10, weight: 50 }, { reps: 10, weight: 50 }]);
  const out = progressSets(pres({ repRangeLow: 6, repRangeHigh: 10, role: 'compound' }), last);
  expect(out[0].weight).toBe(52.5);
  expect(out[0].reps).toBe(6);
});

test('progressSets: below top → same weight, one more rep', () => {
  const last = logged([{ reps: 7, weight: 50 }]);
  const out = progressSets(pres({ repRangeLow: 6, repRangeHigh: 10 }), last);
  expect(out[0].weight).toBe(50);
  expect(out[0].reps).toBe(8);
});

test('progressSets: bodyweight progresses reps only', () => {
  const last = logged([{ reps: 12, weight: 0 }]);
  const out = progressSets(pres({ repRangeLow: 8, repRangeHigh: 15, role: 'isolation' }), last);
  expect(out[0].weight).toBe(0);
  expect(out[0].reps).toBe(13);
});

// --- interval -------------------------------------------------------------
test('buildPhases: tabata has prepare + work + rest (no trailing rest)', () => {
  const phases = buildPhases(INTERVAL_PRESETS.tabata); // 8 rounds, 20/10, prep 10
  expect(phases.length).toBe(1 + 8 + 7);
  expect(phases[0].kind).toBe('prepare');
  expect(phases[phases.length - 1].kind).toBe('work');
});

test('buildPhases: emom has no rest phases', () => {
  const phases = buildPhases(INTERVAL_PRESETS.emom); // restSec 0
  expect(phases.filter((p) => p.kind === 'rest')).toHaveLength(0);
  expect(totalSeconds(INTERVAL_PRESETS.emom)).toBe(10 + 10 * 60);
});

// --- buildPrescription (pure end-to-end) ----------------------------------
test('buildPrescription produces an ordered, scheme-correct session', () => {
  const profile: UserProfile = {
    name: 'Test',
    experience: 'intermediate',
    goal: 'hypertrophy',
    daysPerWeek: 3,
    sessionMinutes: 60,
    injuries: [],
  };
  const splitDay = { id: 'd', name: 'Chest', isRest: false, bodyParts: ['Chest' as const] };
  const candidates = [
    ex({ id: 'press', name: 'Bench Press', target: 'pectorals', equipment: 'Barbell', secondary: ['triceps', 'delts'] }),
    ex({ id: 'incline', name: 'Incline Press', target: 'pectorals', equipment: 'Dumbbell', secondary: ['delts'] }),
    ex({ id: 'fly', name: 'Cable Fly', target: 'pectorals', equipment: 'Cable' }),
  ];
  const out = buildPrescription({
    profile,
    splitDay,
    candidates,
    lastPerf: () => undefined,
    now: 1_700_000_000_000,
  });
  expect(out.exercises.length).toBeGreaterThan(0);
  expect(out.exercises[0].role).toBe('compound');
  for (const e of out.exercises) {
    expect(e.sets).toBeGreaterThanOrEqual(2);
    expect(e.sets).toBeLessThanOrEqual(5);
    expect(e.repRangeLow).toBeGreaterThan(0);
    expect(e.restSeconds).toBeGreaterThan(0);
  }
  expect(out.estimatedMinutes).toBeGreaterThan(0);
  expect(out.warmup.length).toBeGreaterThan(0);
});
