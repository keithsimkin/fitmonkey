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
  /** Email magic-link (OTP) sign-in. Resolves once the email is sent. */
  signInWithMagicLink: (email: string) => Promise<void>;
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

  signInWithMagicLink: async (email) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    // onAuthStateChange will flip status to 'out'.
  },
}));
