/**
 * Build-time preprocessing: fetch the open, public-domain free-exercise-db
 * dataset, map its taxonomy onto the fields this app needs, and write a slim
 * JSON into public/data so it ships as a static asset (cached by the service
 * worker, seeded into IndexedDB on first run).
 *
 * Why this source: the exercise media must be *free*. free-exercise-db is
 * released under the Unlicense (public domain) — no API key, no rate limit, no
 * disputed ownership. Each exercise ships two still frames (start / end); the
 * ExerciseGif component alternates them to fake motion. Images are served from
 * the jsDelivr CDN (see src/lib/gif.ts).
 *
 * Run with:  bun run scripts/preprocess-exercises.ts
 */
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { BodyPart, Equipment } from '../src/types/exercise';

const SOURCE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const OUT = 'public/data/exercises.min.json';

interface RawExercise {
  id: string;
  name: string;
  force: string | null;
  level: string | null;
  mechanic: 'compound' | 'isolation' | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string | null;
  images: string[];
}

// free-exercise-db equipment strings -> the app's Equipment union.
const EQUIPMENT_MAP: Record<string, Equipment> = {
  'body only': 'Body Weight',
  dumbbell: 'Dumbbell',
  barbell: 'Barbell',
  cable: 'Cable',
  machine: 'Leverage Machine',
  kettlebells: 'Kettlebell',
  bands: 'Band',
  'e-z curl bar': 'EZ Barbell',
  'exercise ball': 'Stability Ball',
  'medicine ball': 'Weighted',
  'foam roll': 'Other',
  other: 'Other',
};

// Primary muscle -> the app's coarse BodyPart used by splits and filters.
const MUSCLE_TO_BODY_PART: Record<string, BodyPart> = {
  abdominals: 'Waist',
  abductors: 'Upper Legs',
  adductors: 'Upper Legs',
  biceps: 'Upper Arms',
  calves: 'Lower Legs',
  chest: 'Chest',
  forearms: 'Lower Arms',
  glutes: 'Upper Legs',
  hamstrings: 'Upper Legs',
  lats: 'Back',
  'lower back': 'Back',
  'middle back': 'Back',
  neck: 'Neck',
  quadriceps: 'Upper Legs',
  shoulders: 'Shoulders',
  traps: 'Back',
  triceps: 'Upper Arms',
};

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapEquipment(raw: string | null): Equipment {
  if (!raw) return 'Body Weight'; // null is overwhelmingly stretches / bodyweight moves
  return EQUIPMENT_MAP[raw] ?? 'Other';
}

function mapBodyPart(ex: RawExercise): BodyPart {
  if (ex.category === 'cardio') return 'Cardio';
  const primary = ex.primaryMuscles[0];
  return (primary && MUSCLE_TO_BODY_PART[primary]) || 'Waist';
}

async function main() {
  console.log('Fetching dataset from', SOURCE);
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const raw: RawExercise[] = await res.json();
  console.log(`Loaded ${raw.length} exercises.`);

  const slim = raw
    .filter((e) => e.images && e.images.length > 0)
    .map((e) => ({
      id: e.id,
      name: titleCase(e.name),
      bodyPart: mapBodyPart(e),
      equipment: mapEquipment(e.equipment),
      muscleGroup: e.category ?? '',
      target: e.primaryMuscles[0] ?? '',
      secondary: e.secondaryMuscles ?? [],
      mechanic: e.mechanic ?? undefined,
      images: e.images, // relative paths, e.g. "3_4_Sit-Up/0.jpg" -> buildImageUrl()
      instructions: (e.instructions ?? []).join(' '),
    }));

  await mkdir(dirname(OUT), { recursive: true });
  await Bun.write(OUT, JSON.stringify(slim));

  const bytes = (await Bun.file(OUT).arrayBuffer()).byteLength;
  console.log(`Wrote ${OUT} (${(bytes / 1024 / 1024).toFixed(2)} MB, ${slim.length} records).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
