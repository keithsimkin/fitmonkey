/**
 * Build-time preprocessing: fetch the raw 9.7MB exercises dataset, keep only the
 * English instructions and the fields the app needs, and write a slim JSON into
 * public/data so it ships as a static asset (cached by the service worker, seeded
 * into IndexedDB on first run).
 *
 * Run with:  bun run scripts/preprocess-exercises.ts
 */
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const SOURCE =
  'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
const OUT = 'public/data/exercises.min.json';

interface RawExercise {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  muscle_group: string;
  target: string;
  secondary_muscles: string[];
  media_id: string;
  instructions: Record<string, string>;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  console.log('Fetching dataset from', SOURCE);
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const raw: RawExercise[] = await res.json();
  console.log(`Loaded ${raw.length} exercises.`);

  const slim = raw.map((e) => ({
    id: e.id,
    name: titleCase(e.name),
    bodyPart: titleCase(e.body_part),
    equipment: titleCase(e.equipment),
    muscleGroup: e.muscle_group ?? '',
    target: e.target ?? '',
    secondary: e.secondary_muscles ?? [],
    mediaId: e.media_id,
    instructions: e.instructions?.en ?? '',
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
