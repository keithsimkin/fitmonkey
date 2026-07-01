import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

/** Sticky sub-page header with an optional back button and right action. */
export function PageHeader({ title, onBack, right }: Props) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-app/80 px-3 pt-safe backdrop-blur-xl dark:bg-app-dark/80">
      <div className="flex h-12 w-10 items-center">
        {onBack && (
          <button
            onClick={onBack}
            className="press flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </div>
      <h1 className="truncate text-[17px] font-bold">{title}</h1>
      <div className="flex h-12 w-10 items-center justify-end">{right}</div>
    </header>
  );
}
