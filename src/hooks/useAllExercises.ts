import { useEffect, useState } from 'react';
import type { Exercise } from '../types/exercise';
import { ensureSeeded, getAllExercises } from '../data/db';

interface State {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
}

/**
 * Loads the entire exercise catalog once, lazily. Pass `enabled` to defer the
 * (large) read until the user actually needs it — e.g. focuses the search box —
 * so browsing Discover doesn't pay for it up front.
 */
export function useAllExercises(enabled: boolean): State {
  const [state, setState] = useState<State>({ exercises: [], loading: false, error: null });
  const loaded = state.exercises.length > 0;

  useEffect(() => {
    if (!enabled || loaded) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        await ensureSeeded();
        const exercises = await getAllExercises();
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
  }, [enabled, loaded]);

  return state;
}
