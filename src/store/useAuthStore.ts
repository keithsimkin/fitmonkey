import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type AuthStatus = 'loading' | 'in' | 'out';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;

  /** Wire up the session and subscribe to auth changes. Call once at boot. */
  init: () => void;
  /** Email + password sign-in. Throws on bad credentials. */
  signInWithPassword: (email: string, password: string) => Promise<void>;
  /**
   * Email + password sign-up. Returns `needsConfirmation: true` when the project
   * requires email confirmation (no session yet); otherwise the user is signed
   * in immediately.
   */
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

let initialized = false;

export const useAuthStore = create<AuthState>()((set) => ({
  status: isSupabaseConfigured ? 'loading' : 'out',
  session: null,
  user: null,

  init: () => {
    if (initialized || !supabase) return;
    initialized = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        const session = data.session;
        set({ session, user: session?.user ?? null, status: session ? 'in' : 'out' });
      })
      .catch(() => set({ status: 'out' }));

    // Keep the store in step with sign-in, sign-out, and token refreshes.
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, status: session ? 'in' : 'out' });
    });
  },

  signInWithPassword: async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    // No session means the project has email confirmation on — the user must
    // click the confirmation link before they can sign in.
    return { needsConfirmation: !data.session };
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    // onAuthStateChange will flip status to 'out'.
  },
}));
