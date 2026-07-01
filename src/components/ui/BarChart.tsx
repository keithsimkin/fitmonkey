import { motion } from 'framer-motion';

export interface Bar {
  label: string;
  value: number;
  highlight?: boolean;
  badge?: string;
}

interface Props {
  bars: Bar[];
  height?: number;
  color?: string;
  className?: string;
}

/** Lightweight CSS/flex bar chart with an optionally highlighted bar + badge. */
export function BarChart({ bars, height = 150, color = '#1FD0B0', className = '' }: Props) {
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className={`flex items-end justify-between gap-2 ${className}`} style={{ height }}>
      {bars.map((b, i) => {
        const pct = b.value <= 0 ? 0 : Math.max(0.06, b.value / max);
        return (
          <div key={`${b.label}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="relative flex w-full flex-1 items-end justify-center">
              {b.badge && b.highlight && (
                <span
                  className="absolute -top-1 z-10 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {b.badge}
                </span>
              )}
              <motion.div
                className="w-full max-w-[26px] rounded-full"
                style={{ backgroundColor: b.highlight ? color : undefined }}
                initial={{ height: 0 }}
                animate={{ height: `${pct * 100}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20, delay: i * 0.03 }}
              >
                {!b.highlight && (
                  <div className="h-full w-full rounded-full bg-neutral-200 dark:bg-white/12" />
                )}
              </motion.div>
            </div>
            <span className="text-[11px] font-medium text-neutral-400">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}
