import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Search, X } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Chip } from '../../components/ui/Chip';
import { ExerciseListSkeleton } from '../../components/ui/Skeleton';
import { ExerciseGif } from '../../components/exercise/ExerciseGif';
import { MuscleTag } from '../../components/exercise/MuscleTag';
import { ExerciseInfoSheet } from '../../components/exercise/ExerciseInfoSheet';
import { useExercises } from '../../hooks/useExercises';
import { EQUIPMENT, EQUIPMENT_SHORT } from '../../lib/constants';
import { COLLECTIONS, POPULAR } from '../../lib/images';
import type { BodyPart, Equipment, Exercise } from '../../types/exercise';

export function CategoryScreen() {
  const navigate = useNavigate();
  const { key = '' } = useParams();

  const category = useMemo(
    () => [...COLLECTIONS, ...POPULAR].find((c) => c.key === key),
    [key],
  );
  const bodyParts = category?.bodyParts ?? [];
  const { exercises, loading } = useExercises(bodyParts, EQUIPMENT);

  const [selected, setSelected] = useState<Exercise | null>(null);
  const [query, setQuery] = useState('');
  const [equip, setEquip] = useState<Equipment | 'all'>('all');
  const [part, setPart] = useState<BodyPart | 'all'>('all');

  // Only offer equipment chips that actually appear in this category.
  const equipOptions = useMemo(() => {
    const present = new Set(exercises.map((e) => e.equipment));
    return EQUIPMENT.filter((eq) => present.has(eq));
  }, [exercises]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (equip !== 'all' && e.equipment !== equip) return false;
      if (part !== 'all' && e.bodyPart !== part) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.target.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [exercises, query, equip, part]);

  const activeFilters = (equip !== 'all' ? 1 : 0) + (part !== 'all' ? 1 : 0) + (query ? 1 : 0);

  return (
    <div className="min-h-full pb-24">
      <PageHeader
        title={category?.title ?? 'Exercises'}
        onBack={() => navigate(-1)}
        right={
          activeFilters > 0 ? (
            <button
              onClick={() => {
                setQuery('');
                setEquip('all');
                setPart('all');
              }}
              className="text-[14px] font-semibold text-coral"
            >
              Clear
            </button>
          ) : undefined
        }
      />

      <div className="px-4 pt-2">
        {/* Search */}
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-black/5 px-3 dark:bg-white/10">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises"
            className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-neutral-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="shrink-0 text-neutral-400">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body-part filter — only when the category spans more than one area. */}
        {bodyParts.length > 1 && (
          <div className="no-scrollbar -mx-4 mb-2 flex gap-2 overflow-x-auto px-4">
            <Chip active={part === 'all'} onClick={() => setPart('all')}>
              All areas
            </Chip>
            {bodyParts.map((bp) => (
              <Chip key={bp} active={part === bp} onClick={() => setPart(bp)}>
                {bp}
              </Chip>
            ))}
          </div>
        )}

        {/* Equipment filter */}
        {equipOptions.length > 1 && (
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
            <Chip active={equip === 'all'} onClick={() => setEquip('all')}>
              All gear
            </Chip>
            {equipOptions.map((eq) => (
              <Chip key={eq} active={equip === eq} onClick={() => setEquip(eq)}>
                {EQUIPMENT_SHORT[eq]}
              </Chip>
            ))}
          </div>
        )}

        <p className="mb-3 px-1 text-[13px] text-neutral-500 dark:text-neutral-400">
          {loading
            ? 'Loading…'
            : `${filtered.length} exercise${filtered.length === 1 ? '' : 's'}`}
        </p>

        {loading ? (
          <ExerciseListSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-[15px] text-neutral-500">
            No exercises match these filters.
          </p>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelected(ex)}
                className="card press flex w-full items-center gap-3 p-2.5 text-left"
              >
                <ExerciseGif images={ex.images} alt={ex.name} className="h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold">{ex.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <MuscleTag label={ex.target || ex.bodyPart} />
                    <MuscleTag label={ex.equipment} tone="secondary" />
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300 dark:text-neutral-600" />
              </button>
            ))}
          </div>
        )}
      </div>

      <ExerciseInfoSheet exercise={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
