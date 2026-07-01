import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { startSync, stopSync } from '../lib/sync';

/**
 * Bridges auth state to the sync engine: starts pushing/pulling when a user is
 * signed in, stops on sign-out. No-op when Supabase isn't configured, keeping
 * the app fully local-first.
 */
export function useSync() {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (status === 'in' && userId) {
      void startSync(userId);
    } else if (status === 'out') {
      stopSync();
    }
  }, [status, userId]);
}
