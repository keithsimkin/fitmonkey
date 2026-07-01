import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, Search, X } from 'lucide-react';
import { PhotoCard } from '../../components/ui/PhotoCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ExerciseListSkeleton } from '../../components/ui/Skeleton';
import { ExerciseGif } from '../../components/exercise/ExerciseGif';
import { MuscleTag } from '../../components/exercise/MuscleTag';
import { ExerciseInfoSheet } from '../../components/exercise/ExerciseInfoSheet';
import { useAllExercises } from '../../hooks/useAllExercises';
import { COLLECTIONS, POPULAR } from '../../lib/images';
import type { Exercise } from '../../types/exercise';

const MAX_RESULTS = 50;

// Stable pseudo-rating from a key so cards feel curated without fake data churn.
function ratingFor(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 1000;
  return 4.5 + (h % 5) / 10; // 4.5 – 4.9
}

// Circular affordance in a card's top-right corner so it reads as tappable.
function OpenBadge() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
      <ArrowUpRight className="h-4 w-4 text-white" strokeWidth={2.5} />
    </span>
  );
}

export function DiscoverScreen() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState<Exercise | null>(null);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  // Only load the full catalog once the user engages the search box.
  const { exercises, loading } = useAllExercises(focused || searching);

  const results = useMemo(() => {
    if (!searching) return [];
    return exercises
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.target.toLowerCase().includes(q) ||
          e.bodyPart.toLowerCase().includes(q) ||
          e.equipment.toLowerCase().includes(q),
      )
      .slice(0, MAX_RESULTS);
  }, [exercises, q, searching]);

  return (
    <div className="space-y-8 px-4 pb-4 pt-3">
      <div className="px-1">
        <p className="text-[12px] font-bold uppercase tracking-widest text-coral">Explore</p>
        <h1 className="mt-1 text-[32px] font-extrabold leading-none tracking-tight">Discover</h1>
        <p className="mt-1.5 text-[14px] text-neutral-500 dark:text-neutral-400">
          Browse moves by goal and muscle.
        </p>
      </div>

      {/* Global search across the whole exercise library. */}
      <div className="-mt-3 flex items-center gap-2 rounded-2xl bg-black/5 px-3 dark:bg-white/10">
        <Search className="h-4 w-4 shrink-0 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search all exercises"
          className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-neutral-400"
        />
        {query && (
          <button onClick={() => setQuery('')} className="shrink-0 text-neutral-400" aria-label="Clear search">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searching ? (
        <section>
          <p className="mb-3 px-1 text-[13px] text-neutral-500 dark:text-neutral-400">
            {loading
              ? 'Searching…'
              : `${results.length}${results.length === MAX_RESULTS ? '+' : ''} result${
                  results.length === 1 ? '' : 's'
                }`}
          </p>
          {loading ? (
            <ExerciseListSkeleton rows={6} />
          ) : results.length === 0 ? (
            <p className="py-12 text-center text-[15px] text-neutral-500">
              No exercises match “{query.trim()}”.
            </p>
          ) : (
            <div className="space-y-2.5">
              {results.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelected(ex)}
                  className="card press flex w-full items-center gap-3 p-2.5 text-left"
                >
                  <ExerciseGif mediaId={ex.mediaId} alt={ex.name} className="h-16 w-16 shrink-0" />
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
        </section>
      ) : (
        <>
      <section>
        <SectionHeader title="Popular Workouts" />
        <div className="no-scrollbar snap-x-mandatory -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {POPULAR.map((p) => (
            <PhotoCard
              key={p.key}
              className="snap-start h-60 w-48 shrink-0"
              image={p.art.image}
              color={p.art.color}
              eyebrow={p.homeOnly ? 'No equipment' : `${p.bodyParts.length} areas`}
              title={p.title}
              subtitle={p.subtitle}
              rating={ratingFor(p.key)}
              badge={<OpenBadge />}
              onClick={() => navigate(`/discover/${p.key}`)}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Our Collection" />
        <div className="grid grid-cols-2 gap-3">
          {COLLECTIONS.map((c) => (
            <PhotoCard
              key={c.key}
              className="h-40 w-full"
              image={c.art.image}
              color={c.art.color}
              title={c.title}
              subtitle={c.bodyParts.join(' · ')}
              badge={<OpenBadge />}
              onClick={() => navigate(`/discover/${c.key}`)}
            />
          ))}
        </div>
      </section>
        </>
      )}

      <ExerciseInfoSheet exercise={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
