/**
 * Shimmer placeholders shown while data is loading. Rendering these instead of a
 * blank screen keeps each page's shape stable, so navigating or pulling data
 * feels native rather than flashing empty. Tokens match `ExerciseGif`'s loader.
 */

/** A single pulsing placeholder block. Pass sizing/rounding via `className`. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700/70 ${className}`}
    />
  );
}

/** Placeholder shaped like an exercise list row (GIF thumb + two text lines). */
export function ExerciseRowSkeleton() {
  return (
    <div className="card flex items-center gap-3 p-2.5">
      <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}

/** A column of exercise-row skeletons for loading lists. */
export function ExerciseListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <ExerciseRowSkeleton key={i} />
      ))}
    </div>
  );
}

/** Generic page-shaped skeleton used as the route-level Suspense fallback. */
export function PageSkeleton() {
  return (
    <div className="space-y-6 px-4 pt-6" aria-hidden>
      <Skeleton className="h-9 w-40 rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-3xl" />
      </div>
    </div>
  );
}
