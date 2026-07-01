// The exercise taxonomy, mapped from the public-domain yuhonas/free-exercise-db
// dataset (see scripts/preprocess-exercises.ts) onto the coarse buckets the app
// uses for splits, filtering, and classification.

export type BodyPart =
  | 'Upper Arms'
  | 'Upper Legs'
  | 'Back'
  | 'Waist'
  | 'Chest'
  | 'Shoulders'
  | 'Lower Legs'
  | 'Lower Arms'
  | 'Cardio'
  | 'Neck';

export type Equipment =
  | 'Body Weight'
  | 'Dumbbell'
  | 'Cable'
  | 'Barbell'
  | 'Leverage Machine'
  | 'Band'
  | 'Smith Machine'
  | 'Kettlebell'
  | 'Weighted'
  | 'Stability Ball'
  | 'EZ Barbell'
  | 'Other';

/** Slimmed exercise record stored in IndexedDB (English-only). */
export interface Exercise {
  id: string; // e.g. "Barbell_Bench_Press_-_Medium_Grip"
  name: string;
  bodyPart: BodyPart;
  equipment: Equipment;
  muscleGroup: string; // source `category`, e.g. "strength"
  target: string;
  secondary: string[];
  /** Source compound/isolation label when known; classifier falls back to a heuristic. */
  mechanic?: 'compound' | 'isolation';
  /** Two still frames (start / end), relative paths -> buildImageUrl(path). */
  images: string[];
  instructions: string; // English, single string
}
