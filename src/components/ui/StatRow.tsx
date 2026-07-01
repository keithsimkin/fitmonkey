import type { ReactNode } from 'react';
import { ProgressRing } from './ProgressRing';

interface Props {
  icon: ReactNode;
  iconClassName?: string;
  title: string;
  value: string;
  delta?: string;
  percent?: number; // 0..1, drives the trailing ring
  ringColor?: string;
  onClick?: () => void;
}

/** A metric row: icon tile, title + value (+delta), and an optional trailing ring. */
export function StatRow({
  icon,
  iconClassName = 'bg-coral-soft text-coral',
  title,
  value,
  delta,
  percent,
  ringColor = '#1FD0B0',
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 ${onClick ? 'cursor-pointer active:bg-black/5 dark:active:bg-white/5' : ''}`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400">{title}</p>
        <p className="flex items-baseline gap-1.5">
          <span className="text-[17px] font-bold">{value}</span>
          {delta && <span className="text-[12px] font-semibold text-gain">{delta}</span>}
        </p>
      </div>
      {percent != null && (
        <ProgressRing value={percent} size={44} stroke={5} color={ringColor}>
          <span className="text-[11px] font-bold tabular-nums">{Math.round(percent * 100)}%</span>
        </ProgressRing>
      )}
    </div>
  );
}
