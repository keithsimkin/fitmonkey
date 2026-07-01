import { ChevronRight } from 'lucide-react';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <h2 className="text-[19px] font-bold tracking-tight">{title}</h2>
      {actionLabel && (
        <button
          onClick={onAction}
          className="flex items-center gap-0.5 text-[13px] font-medium text-neutral-500 active:opacity-60 dark:text-neutral-400"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
