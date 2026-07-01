import { useState } from 'react';
import { Star } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  image: string;
  title: string;
  subtitle?: string;
  /** Small overline shown above the title (e.g. a category label). */
  eyebrow?: string;
  /** Solid colour used as the background and as the fallback when the image fails. */
  color: string;
  rating?: number;
  badge?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Image-backed card with a bottom-weighted gradient for legibility. The colour
 * is also the background, so if the CDN image fails (offline / 404) the card
 * still looks intentional.
 */
export function PhotoCard({
  image,
  title,
  subtitle,
  eyebrow,
  color,
  rating,
  badge,
  onClick,
  className = '',
}: Props) {
  const [error, setError] = useState(false);

  return (
    <button
      onClick={onClick}
      className={`press relative isolate overflow-hidden rounded-3xl text-left ${className}`}
      style={{ backgroundColor: color }}
    >
      {!error && (
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setError(true)}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      )}
      {/* Bottom-weighted scrim keeps the photo crisp up top while anchoring the
          title against a dark base. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />

      <div className="flex h-full flex-col justify-between p-4">
        <div className="flex justify-end">{badge}</div>
        <div>
          {eyebrow && (
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/70">
              {eyebrow}
            </p>
          )}
          <h3 className="text-[17px] font-bold leading-tight text-white drop-shadow">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[12px] font-medium text-white/80">{subtitle}</p>
          )}
          {rating != null && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-0.5 text-[11px] font-bold text-neutral-800">
              <Star className="h-3 w-3 fill-amber text-amber" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
