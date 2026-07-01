import type { BodyPart, Equipment } from '../types/exercise';

export const BODY_PARTS: BodyPart[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Upper Arms',
  'Lower Arms',
  'Upper Legs',
  'Lower Legs',
  'Waist',
  'Cardio',
  'Neck',
];

export const EQUIPMENT: Equipment[] = [
  'Body Weight',
  'Dumbbell',
  'Cable',
  'Barbell',
  'Leverage Machine',
  'Band',
  'Smith Machine',
  'Kettlebell',
  'Weighted',
  'Stability Ball',
  'EZ Barbell',
  'Other',
];

/** Equipment realistically available for a home workout. Gym = all of EQUIPMENT. */
export const HOME_EQUIPMENT: Equipment[] = [
  'Body Weight',
  'Dumbbell',
  'Band',
  'Kettlebell',
  'Stability Ball',
];

/** Friendlier short labels used on compact chips. */
export const EQUIPMENT_SHORT: Record<Equipment, string> = {
  'Body Weight': 'Bodyweight',
  Dumbbell: 'Dumbbell',
  Cable: 'Cable',
  Barbell: 'Barbell',
  'Leverage Machine': 'Machine',
  Band: 'Band',
  'Smith Machine': 'Smith',
  Kettlebell: 'Kettlebell',
  Weighted: 'Weighted',
  'Stability Ball': 'Stability Ball',
  'EZ Barbell': 'EZ Bar',
  Other: 'Other',
};
