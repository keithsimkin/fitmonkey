interface Props {
  name?: string;
  size?: number;
  className?: string;
}

/** Circular avatar showing the user's initials over a brand colour. */
export function Avatar({ name, size = 44, className = '' }: Props) {
  const initials = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-coral font-bold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials || '🏋️'}
    </div>
  );
}
