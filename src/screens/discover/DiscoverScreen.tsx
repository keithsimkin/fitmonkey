import { useNavigate } from 'react-router-dom';
import { PhotoCard } from '../../components/ui/PhotoCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { COLLECTIONS, POPULAR } from '../../lib/images';

// Stable pseudo-rating from a key so cards feel curated without fake data churn.
function ratingFor(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 1000;
  return 4.5 + (h % 5) / 10; // 4.5 – 4.9
}

export function DiscoverScreen() {
  const navigate = useNavigate();

  return (
    <div className="space-y-7 px-4 pb-4 pt-3">
      <div className="px-1">
        <h1 className="text-[32px] font-extrabold tracking-tight">Discover</h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400">
          Browse moves by goal and muscle.
        </p>
      </div>

      <section>
        <SectionHeader title="Popular Workouts" />
        <div className="no-scrollbar snap-x-mandatory -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {POPULAR.map((p) => (
            <PhotoCard
              key={p.key}
              className="snap-start h-56 w-44 shrink-0"
              image={p.art.image}
              color={p.art.color}
              title={p.title}
              subtitle={p.subtitle}
              rating={ratingFor(p.key)}
              onClick={() => navigate(`/discover/${p.key}`)}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Our Collection" />
        <div className="space-y-3">
          {COLLECTIONS.map((c) => (
            <PhotoCard
              key={c.key}
              className="h-28 w-full"
              image={c.art.image}
              color={c.art.color}
              title={c.title}
              subtitle={`${c.bodyParts.join(' · ')}`}
              onClick={() => navigate(`/discover/${c.key}`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
