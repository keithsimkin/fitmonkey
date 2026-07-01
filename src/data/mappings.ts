import type { BodyPart } from '../types/exercise';
import type { Split, SplitDay } from '../types/app';

// Deterministic ids so built-in splits stay stable across rebuilds / reseeds.
function day(id: string, name: string, bodyParts: BodyPart[]): SplitDay {
  return { id, name, isRest: false, bodyParts };
}
function rest(id: string): SplitDay {
  return { id, name: 'Rest', isRest: true, bodyParts: [] };
}

const PUSH = day('ppl-push', 'Push', ['Chest', 'Shoulders', 'Upper Arms']);
const PULL = day('ppl-pull', 'Pull', ['Back', 'Upper Arms', 'Lower Arms']);
const LEGS = day('ppl-legs', 'Legs', ['Upper Legs', 'Lower Legs', 'Waist']);

const UPPER = day('ul-upper', 'Upper', [
  'Chest',
  'Back',
  'Shoulders',
  'Upper Arms',
  'Lower Arms',
]);
const LOWER = day('ul-lower', 'Lower', ['Upper Legs', 'Lower Legs', 'Waist']);

const FULL = day('fb-full', 'Full Body', [
  'Chest',
  'Back',
  'Shoulders',
  'Upper Legs',
  'Upper Arms',
  'Waist',
]);

export const BUILT_IN_SPLITS: Split[] = [
  {
    id: 'split-ppl',
    name: 'Push / Pull / Legs',
    builtIn: true,
    days: [PUSH, PULL, LEGS, rest('ppl-rest')],
  },
  {
    id: 'split-upper-lower',
    name: 'Upper / Lower',
    builtIn: true,
    days: [UPPER, LOWER, rest('ul-rest')],
  },
  {
    id: 'split-full-body',
    name: 'Full Body',
    builtIn: true,
    days: [FULL, rest('fb-rest')],
  },
  {
    id: 'split-bro',
    name: 'Bro Split',
    builtIn: true,
    days: [
      day('bro-chest', 'Chest', ['Chest']),
      day('bro-back', 'Back', ['Back']),
      day('bro-shoulders', 'Shoulders', ['Shoulders']),
      day('bro-arms', 'Arms', ['Upper Arms', 'Lower Arms']),
      day('bro-legs', 'Legs', ['Upper Legs', 'Lower Legs']),
      rest('bro-rest'),
    ],
  },
];

export const DEFAULT_ACTIVE_SPLIT_ID = 'split-ppl';
