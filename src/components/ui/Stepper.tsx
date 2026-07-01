import { Minus, Plus } from 'lucide-react';

interface Props {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min?: number;
}

/** Compact ± stepper for numeric inputs (reps, weight) in the guided player. */
export function Stepper({ value, onChange, step, min = 0 }: Props) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        className="press flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
        aria-label="Decrease"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[3rem] text-center text-[24px] font-bold tabular-nums">{value}</span>
      <button
        onClick={() => onChange(+(value + step).toFixed(2))}
        className="press flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
        aria-label="Increase"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
