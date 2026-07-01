import { Sheet } from '../../components/ios/Sheet';
import { ExerciseGif } from '../../components/exercise/ExerciseGif';
import { MuscleTag } from '../../components/exercise/MuscleTag';
import { useExercises } from '../../hooks/useExercises';
import type { BodyPart, Equipment, Exercise } from '../../types/exercise';

interface Props {
  open: boolean;
  bodyParts: BodyPart[];
  equipment: Equipment[];
  excludeIds: Set<string>;
  onPick: (exercise: Exercise) => void;
  onClose: () => void;
}

/** Manual exercise picker (secondary to the engine-generated plan). */
export function AddExerciseSheet({ open, bodyParts, equipment, excludeIds, onPick, onClose }: Props) {
  const { exercises, loading } = useExercises(bodyParts, equipment);
  const list = exercises.filter((e) => !excludeIds.has(e.id));

  return (
    <Sheet open={open} onClose={onClose} title="Add Exercise">
      {loading ? (
        <p className="py-10 text-center text-neutral-500">Loading…</p>
      ) : (
        <div className="space-y-2.5 pb-2">
          {list.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onPick(ex)}
              className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.03] p-2.5 text-left active:opacity-80 dark:bg-white/[0.05]"
            >
              <ExerciseGif images={ex.images} alt={ex.name} className="h-14 w-14 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{ex.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <MuscleTag label={ex.target || ex.bodyPart} />
                  <MuscleTag label={ex.equipment} tone="secondary" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
