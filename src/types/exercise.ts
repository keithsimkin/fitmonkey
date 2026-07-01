// The exercise taxonomy as it appears in hasaneyldrm/exercises-dataset.

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
  id: string; // e.g. "0001"
  name: string;
  bodyPart: BodyPart;
  equipment: Equipment;
  muscleGroup: string;
  target: string;
  secondary: string[];
  mediaId: string; // -> buildGifUrl(mediaId)
  instructions: string; // English, single string
}
