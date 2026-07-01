import { useEffect, useState } from 'react';
import type { BodyPart, Equipment, Exercise } from '../types/exercise';
import { ensureSeeded } from '../data/db';
import { forDay } from '../data/exercises';

interface State {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
}

/** Loads exercises for a split day's body parts filtered by available equipment. */
export function useExercises(bodyParts: BodyPart[], equipment: Equipment[]): State {
  const [state, setState] = useState<State>({
    exercises: [],
    loading: true,
    error: null,
  });

  // Stable keys so the effect only refires on real changes.
  const bpKey = bodyParts.join(',');
  const eqKey = equipment.join(',');

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        await ensureSeeded();
        const exercises = await forDay({ bodyParts, equipment });
        if (!cancelled) setState({ exercises, loading: false, error: null });
      } catch (err) {
        if (!cancelled)
          setState({
            exercises: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load exercises',
          });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpKey, eqKey]);

  return state;
}
