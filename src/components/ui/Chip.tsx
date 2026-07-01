import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/** Small selectable pill used for tags and multi-select options. */
export function Chip({ children, active = false, onClick, className = '' }: Props) {
  return (
    <button
      onClick={onClick}
      className={`press rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
        active
          ? 'bg-ink text-white dark:bg-white dark:text-ink'
          : 'bg-black/5 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
      } ${className}`}
    >
      {children}
    </button>
  );
}
