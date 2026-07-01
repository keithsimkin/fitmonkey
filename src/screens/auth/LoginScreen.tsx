import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck, Send } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { isSupabaseConfigured } from '../../lib/supabase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';

type Phase = 'idle' | 'sending' | 'sent';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signInWithMagicLink);
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const valid = EMAIL_RE.test(email.trim());

  async function send() {
    if (!valid || phase === 'sending') return;
    setPhase('sending');
    setError(null);
    try {
      await signIn(email.trim());
      setPhase('sent');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the link. Try again.');
      setPhase('idle');
    }
  }

  return (
    <div className="min-h-full pb-10">
      <PageHeader title="Sign in" onBack={() => navigate(-1)} />

      <div className="space-y-6 px-5 pt-6">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight">Sync across devices</h1>
          <p className="mt-1.5 text-[15px] leading-snug text-neutral-500 dark:text-neutral-400">
            Sign in to back up your profile, workouts and weigh-ins to the cloud and pick up
            where you left off on any device. Everything keeps working offline.
          </p>
        </div>

        {!isSupabaseConfigured ? (
          <Card className="p-4 text-[14px] leading-snug text-neutral-500 dark:text-neutral-400">
            Cloud sync isn't configured on this build. Add your Supabase URL and anon key to
            <code className="mx-1 rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">.env.local</code>
            to enable sign-in.
          </Card>
        ) : phase === 'sent' ? (
          <Card className="flex items-start gap-3.5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mint/15 text-mint">
              <MailCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold">Check your inbox</p>
              <p className="mt-0.5 text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
                We sent a magic link to <span className="font-semibold">{email.trim()}</span>. Open
                it on this device to finish signing in.
              </p>
              <button
                onClick={() => setPhase('idle')}
                className="press mt-2 text-[14px] font-semibold text-coral"
              >
                Use a different email
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') void send();
              }}
              className="w-full rounded-2xl border border-black/[0.07] bg-white px-4 py-3.5 text-[16px] outline-none transition-colors focus:border-coral dark:border-white/10 dark:bg-surface-dark"
            />

            {error && <p className="px-1 text-[13px] text-coral">{error}</p>}

            <button
              onClick={() => void send()}
              disabled={!valid || phase === 'sending'}
              className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-coral py-3.5 text-[16px] font-bold text-white transition-opacity disabled:opacity-40"
            >
              <Send className="h-5 w-5" />
              {phase === 'sending' ? 'Sending…' : 'Send magic link'}
            </button>

            <p className="px-1 text-center text-[12px] text-neutral-400">
              No password needed — we email you a one-tap sign-in link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
