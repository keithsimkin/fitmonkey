import { useEffect, useRef, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { buildImageUrl } from '../../lib/gif';

interface Props {
  /** Ordered still frames (free-exercise-db ships two: start / end). */
  images: string[];
  alt: string;
  className?: string;
  rounded?: boolean;
}

// How long each frame is held before crossfading to the next. Slow enough to
// read as a single rep rather than a flicker.
const FRAME_MS = 750;

/**
 * Exercise animation faked from the source's two still frames (start / end):
 * the frames are stacked and cross-faded on a timer to imply motion. Falls back
 * to a static first frame when reduced motion is preferred or only one frame
 * exists. Skeleton placeholder while the first frame loads; glyph on error.
 */
export function ExerciseGif({ images, alt, className = '', rounded = true }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [frame, setFrame] = useState(0);
  const firstRef = useRef<HTMLImageElement>(null);

  const urls = images.map(buildImageUrl);
  const firstUrl = urls[0];

  // A cached image can finish loading before React attaches `onLoad`, which
  // would leave it stuck invisible behind the skeleton. Sync from the element's
  // own complete/naturalWidth flags on mount and whenever the source changes.
  useEffect(() => {
    setFrame(0);
    const img = firstRef.current;
    if (img?.complete) {
      if (img.naturalWidth > 0) {
        setLoaded(true);
        setError(false);
      } else {
        setError(true);
      }
    } else {
      setLoaded(false);
      setError(false);
    }
  }, [firstUrl]);

  // Cross-fade between frames once the first is visible. Skipped for a single
  // frame or when the user prefers reduced motion.
  useEffect(() => {
    if (error || urls.length < 2 || !loaded) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setFrame((f) => (f + 1) % urls.length);
    }, FRAME_MS);
    return () => window.clearInterval(timer);
  }, [error, loaded, urls.length]);

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-neutral-800 ${
        rounded ? 'rounded-2xl' : ''
      } ${className}`}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200 dark:bg-neutral-700" />
      )}
      {error || urls.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
          <Dumbbell className="h-8 w-8" />
        </div>
      ) : (
        urls.map((url, i) => (
          <img
            key={url}
            ref={i === 0 ? firstRef : undefined}
            src={url}
            alt={i === 0 ? alt : ''}
            aria-hidden={i !== 0}
            loading="lazy"
            decoding="async"
            onLoad={i === 0 ? () => setLoaded(true) : undefined}
            onError={i === 0 ? () => setError(true) : undefined}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
              loaded && frame === i ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))
      )}
    </div>
  );
}
