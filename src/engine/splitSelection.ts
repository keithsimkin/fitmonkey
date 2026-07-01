import type { BodyPart, Exercise } from '../types/exercise';
import type { InjuryFlag } from './types';

/**
 * Recommend a built-in split id from weekly training frequency. Returns ids that
 * exist in `src/data/mappings.ts`. The engine drives the split choice from the
 * profile rather than asking the user to pick one.
 */
export function recommendSplitId(daysPerWeek: number): string {
  if (daysPerWeek <= 3) return 'split-full-body';
  if (daysPerWeek === 4) return 'split-upper-lower';
  return 'split-ppl';
}

/**
 * Resolve the active split id from the user's preference. An explicit, still-
 * available split wins; otherwise (`'auto'`, unset, or a deleted split) we fall
 * back to the frequency-based recommendation.
 */
export function resolveActiveSplitId(
  preference: string | undefined,
  daysPerWeek: number,
  availableSplitIds: string[],
): string {
  if (preference && preference !== 'auto' && availableSplitIds.includes(preference)) {
    return preference;
  }
  return recommendSplitId(daysPerWeek);
}

interface ExclusionRule {
  targets?: string[];
  bodyParts?: BodyPart[];
  namePattern?: RegExp;
}

// Map each injury flag to muscles / body parts / movements to avoid.
const INJURY_EXCLUSIONS: Record<InjuryFlag, ExclusionRule> = {
  lowerBack: {
    targets: ['spine'],
    namePattern: /deadlift|good morning|back extension|hyperextension/i,
  },
  knee: {
    namePattern: /\b(squat|lunge|leg extension|leg press|pistol|jump)\b/i,
  },
  shoulder: {
    namePattern: /\b(overhead press|military press|behind the neck|upright row|snatch|jerk)\b/i,
  },
  elbow: {
    namePattern: /\b(skull ?crusher|triceps? dip|close grip)\b/i,
  },
  wrist: {
    namePattern: /\b(wrist|reverse curl|front lever|knuckle)\b/i,
  },
  neck: {
    bodyParts: ['Neck'],
    namePattern: /\bneck\b/i,
  },
  ankle: {
    namePattern: /\b(calf raise|box jump|skater|jump rope)\b/i,
  },
  hip: {
    namePattern: /\b(hip thrust|good morning|deadlift|abduction|adduction)\b/i,
  },
};

/** True if an exercise should be excluded for any of the user's injuries. */
export function isExcluded(ex: Exercise, injuries: InjuryFlag[]): boolean {
  for (const inj of injuries) {
    const rule = INJURY_EXCLUSIONS[inj];
    if (rule.targets?.includes(ex.target.toLowerCase())) return true;
    if (rule.bodyParts?.includes(ex.bodyPart)) return true;
    if (rule.namePattern?.test(ex.name)) return true;
  }
  return false;
}
