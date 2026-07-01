import { Sheet } from '../ios/Sheet';
import { ExerciseGif } from './ExerciseGif';
import { MuscleTag } from './MuscleTag';
import type { Exercise } from '../../types/exercise';

interface Props {
  exercise: Exercise | null;
  onClose: () => void;
}

/** Read-only exercise detail (no set logging) for browsing in Discover. */
export function ExerciseInfoSheet({ exercise, onClose }: Props) {
  return (
    <Sheet
      open={exercise !== null}
      onClose={onClose}
      title={exercise?.name}
      action={
        <button onClick={onClose} className="text-[17px] font-semibold text-coral">
          Done
        </button>
      }
    >
      {exercise && (
        <div className="space-y-4">
          <ExerciseGif images={exercise.images} alt={exercise.name} animate className="aspect-square w-full" />
          <div className="flex flex-wrap gap-1.5">
            <MuscleTag label={exercise.target || exercise.bodyPart} />
            {exercise.secondary.slice(0, 3).map((m) => (
              <MuscleTag key={m} label={m} tone="secondary" />
            ))}
            <MuscleTag label={exercise.equipment} tone="secondary" />
          </div>
          {exercise.instructions && (
            <div>
              <h4 className="mb-1 text-[15px] font-semibold">How to do it</h4>
              <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                {exercise.instructions}
              </p>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
