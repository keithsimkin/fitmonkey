import type { BodyPart, Equipment, Exercise } from '../types/exercise';
import { getExercisesByBodyPart } from './db';

export interface ForDayOptions {
  bodyParts: BodyPart[];
  equipment: Equipment[];
  limit?: number;
}

/**
 * Exercises for a given day's split + available equipment. Pulls every target
 * body part, filters by the available equipment set, dedupes, ranks bodyweight
 * and "target"-matched moves first, then slices to `limit`.
 */
export async function forDay({
  bodyParts,
  equipment,
  limit,
}: ForDayOptions): Promise<Exercise[]> {
  const equipSet = new Set(equipment);
  const byId = new Map<string, Exercise>();

  const groups = await Promise.all(bodyParts.map((bp) => getExercisesByBodyPart(bp)));
  for (const group of groups) {
    for (const ex of group) {
      if (!equipSet.has(ex.equipment)) continue;
      if (!byId.has(ex.id)) byId.set(ex.id, ex);
    }
  }

  const all = [...byId.values()];
  all.sort((a, b) => {
    // Bodyweight moves first (always doable), then alphabetical.
    const aw = a.equipment === 'Body Weight' ? 0 : 1;
    const bw = b.equipment === 'Body Weight' ? 0 : 1;
    if (aw !== bw) return aw - bw;
    return a.name.localeCompare(b.name);
  });

  return limit ? all.slice(0, limit) : all;
}
