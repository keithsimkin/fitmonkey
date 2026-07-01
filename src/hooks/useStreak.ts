import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { deriveStreak } from '../store/selectors';

export function useStreak(): number {
  const logs = useAppStore((s) => s.logs);
  return useMemo(() => deriveStreak(logs, new Date()), [logs]);
}
