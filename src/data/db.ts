import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Exercise } from '../types/exercise';

interface ExerciseDB extends DBSchema {
  exercises: {
    key: string;
    value: Exercise;
    indexes: { byBodyPart: string; byEquipment: string };
  };
  meta: {
    key: string;
    value: { key: string; value: unknown };
  };
}

const DB_NAME = 'workout-db';
const DB_VERSION = 1;
const SEED_KEY = 'seeded-v1';

let dbPromise: Promise<IDBPDatabase<ExerciseDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ExerciseDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('exercises', { keyPath: 'id' });
        store.createIndex('byBodyPart', 'bodyPart');
        store.createIndex('byEquipment', 'equipment');
        db.createObjectStore('meta', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

/** Seed the exercise catalog from the static JSON on first launch. Idempotent. */
export async function ensureSeeded(): Promise<void> {
  const db = await getDB();
  const seeded = await db.get('meta', SEED_KEY);
  if (seeded) return;

  const res = await fetch(`${import.meta.env.BASE_URL}data/exercises.min.json`);
  if (!res.ok) throw new Error(`Failed to load exercise data: ${res.status}`);
  const exercises: Exercise[] = await res.json();

  const tx = db.transaction('exercises', 'readwrite');
  await Promise.all(exercises.map((e) => tx.store.put(e)));
  await tx.done;
  await db.put('meta', { key: SEED_KEY, value: Date.now() });
}

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB();
  return db.getAll('exercises');
}

/** Number of exercises in the local catalog (0 until seeded). */
export async function countExercises(): Promise<number> {
  const db = await getDB();
  return db.count('exercises');
}

export async function getExercisesByBodyPart(bodyPart: string): Promise<Exercise[]> {
  const db = await getDB();
  return db.getAllFromIndex('exercises', 'byBodyPart', bodyPart);
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  const db = await getDB();
  return db.get('exercises', id);
}
