import { useEffect, useRef, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { buildGifUrl } from '../../lib/gif';

interface Props {
  mediaId: string;
  alt: string;
  className?: string;
  rounded?: boolean;
}

/**
 * Animated exercise GIF with a skeleton placeholder, fade-in, and a glyph
 * fallback. Uses native lazy loading so off-screen GIFs in long lists are
 * deferred by the browser.
 */
export function ExerciseGif({ mediaId, alt, className = '', rounded = true }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // A cached GIF — the common case once the service worker has it (CacheFirst) —
  // can finish loading before React attaches `onLoad`, which would leave it stuck
  // invisible (opacity-0) behind the skeleton forever. Sync state from the
  // element's own `complete`/`naturalWidth` flags on mount and whenever the
  // source changes, so we never miss an already-complete image.
  useEffect(() => {
    const img = imgRef.current;
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
  }, [mediaId]);

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-neutral-800 ${
        rounded ? 'rounded-2xl' : ''
      } ${className}`}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200 dark:bg-neutral-700" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
          <Dumbbell className="h-8 w-8" />
        </div>
      ) : (
        <img
          ref={imgRef}
          src={buildGifUrl(mediaId)}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`h-full w-full object-contain transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
