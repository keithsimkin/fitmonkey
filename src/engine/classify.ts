import type { Equipment, Exercise } from '../types/exercise';
import type { Role } from './types';

// Large, multi-joint target muscles skew an exercise toward "compound".
const COMPOUND_TARGETS = new Set([
  'quads',
  'hamstrings',
  'glutes',
  'lats',
  'upper back',
  'pectorals',
  'delts',
]);

// Small single-joint targets skew toward "isolation".
const ISOLATION_TARGETS = new Set([
  'biceps',
  'triceps',
  'calves',
  'forearms',
  'abs',
  'obliques',
  'traps',
  'serratus anterior',
  'adductors',
  'abductors',
  'levator scapulae',
  'spine',
]);

const COMPOUND_EQUIPMENT = new Set<Equipment>([
  'Barbell',
  'EZ Barbell',
  'Smith Machine',
  'Kettlebell',
]);

const COMPOUND_NAME = /\b(squat|deadlift|press|row|pulldown|pull-?up|chin-?up|lunge|clean|thruster|dip)\b/;
const ISOLATION_NAME = /\b(curl|extension|raise|fly|flye|kickback|shrug|crunch|calf)\b/;

/**
 * Heuristic compound/isolation classifier — no per-exercise labels required.
 * Combines four independently-weak signals (target muscle, recruited-muscle
 * count, equipment, and name tokens) into a score. Defaults toward isolation
 * (the safer "accessory" bucket) for unusual exercises.
 */
export function classifyRole(ex: Exercise): Role {
  let score = 0;

  const target = ex.target.toLowerCase();
  if (COMPOUND_TARGETS.has(target)) score += 2;
  if (ISOLATION_TARGETS.has(target)) score -= 2;

  // More recruited muscles ⇒ more compound. 1→0, 2→+1, 3+→+2.
  score += Math.min(ex.secondary.length, 3) - 1;

  if (COMPOUND_EQUIPMENT.has(ex.equipment)) score += 1;

  const name = ex.name.toLowerCase();
  if (COMPOUND_NAME.test(name)) score += 2;
  if (ISOLATION_NAME.test(name)) score -= 2;

  return score >= 1 ? 'compound' : 'isolation';
}
