import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, MailCheck, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { isSupabaseConfigured } from '../../lib/supabase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';

type Mode = 'signin' | 'signup';
type Phase = 'idle' | 'submitting' | 'confirm';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

export function LoginScreen() {
  const navigate = useNavigate();
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const signUp = useAuthStore((s) => s.signUp);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const valid = EMAIL_RE.test(email.trim()) && password.length >= MIN_PASSWORD;

  async function submit() {
    if (!valid || phase === 'submitting') return;
    setPhase('submitting');
    setError(null);
    try {
      if (mode === 'signup') {
        const { needsConfirmation } = await signUp(email.trim(), password);
        if (needsConfirmation) {
          setPhase('confirm');
          return;
        }
        // Signed in immediately (confirmation disabled) — auth state will route away.
      } else {
        await signInWithPassword(email.trim(), password);
      }
      // On success the session updates and navigation is up to the caller; head back.
      navigate(-1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      setPhase('idle');
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPhase('idle');
  }

  return (
    <div className="min-h-full pb-10">
      <PageHeader title={mode === 'signup' ? 'Create account' : 'Sign in'} onBack={() => navigate(-1)} />

      <div className="space-y-6 px-5 pt-6">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight">Sync across devices</h1>
          <p className="mt-1.5 text-[15px] leading-snug text-neutral-500 dark:text-neutral-400">
            {mode === 'signup'
              ? 'Create an account to back up your profile, workouts and weigh-ins and use them on any device. Everything keeps working offline.'
              : 'Sign in to restore your data and keep it in sync across devices. Everything keeps working offline.'}
          </p>
        </div>

        {!isSupabaseConfigured ? (
          <Card className="p-4 text-[14px] leading-snug text-neutral-500 dark:text-neutral-400">
            Cloud sync isn't configured on this build. Add your Supabase URL and anon key to
            <code className="mx-1 rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">.env.local</code>
            to enable accounts.
          </Card>
        ) : phase === 'confirm' ? (
          <Card className="flex items-start gap-3.5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mint/15 text-mint">
              <MailCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold">Confirm your email</p>
              <p className="mt-0.5 text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
                We sent a confirmation link to <span className="font-semibold">{email.trim()}</span>.
                Click it, then come back and sign in.
              </p>
              <button
                onClick={() => switchMode('signin')}
                className="press mt-2 text-[14px] font-semibold text-coral"
              >
                Back to sign in
              </button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-black/[0.07] bg-white px-4 py-3.5 text-[16px] outline-none transition-colors focus:border-coral dark:border-white/10 dark:bg-surface-dark"
            />

            <input
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit();
              }}
              className="w-full rounded-2xl border border-black/[0.07] bg-white px-4 py-3.5 text-[16px] outline-none transition-colors focus:border-coral dark:border-white/10 dark:bg-surface-dark"
            />

            {mode === 'signup' && password.length > 0 && password.length < MIN_PASSWORD && (
              <p className="px-1 text-[13px] text-neutral-500 dark:text-neutral-400">
                Use at least {MIN_PASSWORD} characters.
              </p>
            )}
            {error && <p className="px-1 text-[13px] text-coral">{error}</p>}

            <button
              onClick={() => void submit()}
              disabled={!valid || phase === 'submitting'}
              className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-coral py-3.5 text-[16px] font-bold text-white transition-opacity disabled:opacity-40"
            >
              {mode === 'signup' ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
              {phase === 'submitting'
                ? mode === 'signup'
                  ? 'Creating…'
                  : 'Signing in…'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
            </button>

            <button
              onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
              className="press w-full py-1 text-center text-[14px] font-semibold text-coral"
            >
              {mode === 'signup'
                ? 'Already have an account? Sign in'
                : "New here? Create an account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
