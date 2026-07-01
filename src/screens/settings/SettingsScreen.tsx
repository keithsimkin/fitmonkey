import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Sun,
  Moon,
  SunMoon,
  Ruler,
  CalendarDays,
  Volume2,
  ShieldCheck,
  Dumbbell,
  HardDrive,
  Info,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Toggle } from '../../components/ui/Toggle';
import { setFeedbackEnabled, startCue } from '../../lib/audioCue';
import { GOAL_LABELS } from '../../engine/schemes';
import { countExercises, ensureSeeded } from '../../data/db';
import { APP_VERSION, formatBytes } from '../../lib/appInfo';
import type { ThemeMode } from '../../types/app';

const THEME_TILES: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'Auto', Icon: SunMoon },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export function SettingsScreen() {
  const navigate = useNavigate();
  const settings = useAppStore((s) => s.settings);
  const profile = useAppStore((s) => s.profile);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetAll = useAppStore((s) => s.resetAll);
  const totalWorkouts = useAppStore(
    (s) => Object.values(s.logs).filter((l) => l.completedAt).length,
  );
  const device = useDeviceInfo();

  return (
    <div className="pb-10 pt-3">
      <div className="px-5">
        <h1 className="text-[32px] font-extrabold tracking-tight">Settings</h1>
      </div>

      <div className="space-y-7 px-4 pt-4">
        {/* Profile */}
        <Card className="press flex items-center gap-3.5 p-4" onClick={() => navigate('/profile')}>
          <Avatar name={profile?.name} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-bold">
              {profile ? profile.name || 'Your profile' : 'Set up your profile'}
            </p>
            <p className="truncate text-[13px] text-neutral-500 dark:text-neutral-400">
              {profile
                ? `${GOAL_LABELS[profile.goal]} · ${profile.daysPerWeek} days/week · ${totalWorkouts} workout${totalWorkouts === 1 ? '' : 's'}`
                : 'Drives your generated workouts'}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300 dark:text-neutral-600" />
        </Card>

        {/* Appearance — visual tiles instead of a pill-in-card control */}
        <Section label="Appearance">
          <div className="grid grid-cols-3 gap-3">
            {THEME_TILES.map(({ value, label, Icon }) => {
              const active = settings.themeMode === value;
              return (
                <button
                  key={value}
                  onClick={() => updateSettings({ themeMode: value })}
                  className={`press flex flex-col items-center gap-2 rounded-3xl border-2 py-4 shadow-card transition-colors ${
                    active
                      ? 'border-coral bg-coral-soft/70 text-coral dark:bg-coral/15'
                      : 'border-transparent bg-white text-neutral-500 dark:bg-surface-dark dark:text-neutral-400'
                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />
                  <span className="text-[13px] font-semibold">{label}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Preferences — one grouped card of rows */}
        <Section label="Preferences">
          <Card className="divide-y divide-black/5 dark:divide-white/10">
            <Row icon={<Ruler className="h-5 w-5" />} tint="bg-mint/15 text-mint" label="Units">
              <InlineChoice
                value={settings.units}
                onChange={(units) => updateSettings({ units })}
                options={[
                  { value: 'kg', label: 'kg' },
                  { value: 'lb', label: 'lb' },
                ]}
              />
            </Row>

            <Row
              icon={<CalendarDays className="h-5 w-5" />}
              tint="bg-lilac-soft text-lilac dark:bg-lilac/20"
              label="Week starts on"
            >
              <InlineChoice
                value={String(settings.startWeekday) as '0' | '1'}
                onChange={(v) => updateSettings({ startWeekday: Number(v) as 0 | 1 })}
                options={[
                  { value: '1', label: 'Mon' },
                  { value: '0', label: 'Sun' },
                ]}
              />
            </Row>

            <Row
              icon={<Volume2 className="h-5 w-5" />}
              tint="bg-peach-soft text-amber dark:bg-amber/20"
              label="Sounds & haptics"
              description="Cues for starts, sets, rest & timers"
            >
              <Toggle
                checked={settings.sound}
                label="Sounds & haptics"
                onChange={(sound) => {
                  // Update the module flag first so the confirmation cue is audible
                  // immediately (the store-synced effect runs only after re-render).
                  setFeedbackEnabled(sound);
                  updateSettings({ sound });
                  if (sound) startCue();
                }}
              />
            </Row>
          </Card>
        </Section>

        {/* About / your data */}
        <Section label="About">
          <Card className="mb-3 flex items-start gap-3.5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mint/15 text-mint">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold">Private &amp; on-device</p>
              <p className="mt-0.5 text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
                Your profile, workouts and weigh-ins live only on this device — there's no
                account and nothing is uploaded.
              </p>
            </div>
          </Card>

          <Card className="divide-y divide-black/5 dark:divide-white/10">
            <Row
              icon={<Dumbbell className="h-5 w-5" />}
              tint="bg-coral-soft text-coral dark:bg-coral/15"
              label="Exercise library"
            >
              <Value>{device.exercises != null ? `${device.exercises.toLocaleString()} moves` : '—'}</Value>
            </Row>
            <Row
              icon={<HardDrive className="h-5 w-5" />}
              tint="bg-lilac-soft text-lilac dark:bg-lilac/20"
              label="Offline storage used"
            >
              <Value>{device.usage ?? '—'}</Value>
            </Row>
            <Row icon={<Info className="h-5 w-5" />} tint="bg-mint/15 text-mint" label="Version">
              <Value>{APP_VERSION}</Value>
            </Row>
          </Card>
        </Section>

        {/* Data management */}
        <Card
          className="press flex items-center gap-3.5 p-4"
          onClick={() => {
            if (confirm('Reset all workouts, profile, weight log and settings?')) resetAll();
          }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-coral-soft text-coral dark:bg-coral/15">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[16px] font-semibold text-coral">Reset all data</p>
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
              Clears workouts, profile, weigh-ins &amp; settings
            </p>
          </div>
        </Card>

        <p className="px-1 text-center text-[12px] text-neutral-400">
          On-device workout engine · Exercise data &amp; animations from the ExerciseDB dataset.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Local building blocks
// ---------------------------------------------------------------------------

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <p className="mb-2.5 px-1 text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      {children}
    </section>
  );
}

/** A grouped-list row: icon tile + label (+ description) + a right-side control. */
function Row({
  icon,
  tint,
  label,
  description,
  children,
}: {
  icon: ReactNode;
  tint: string;
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold">{label}</p>
        {description && (
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

/** Read-only right-aligned value text for info rows. */
function Value({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 text-[15px] font-medium tabular-nums text-neutral-500 dark:text-neutral-400">
      {children}
    </span>
  );
}

/**
 * Compact inline selector: the active option gets a solid coral pill, the rest
 * stay plain text. Replaces the segmented-control-inside-a-card "pill on pill".
 */
function InlineChoice<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3.5 py-1.5 text-[14px] font-semibold transition-colors ${
              active
                ? 'bg-coral text-white shadow-sm'
                : 'text-neutral-400 active:opacity-70 dark:text-neutral-500'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

interface DeviceInfo {
  exercises: number | null;
  usage: string | null;
}

/** Best-effort device facts for the About section (catalog size & storage use). */
function useDeviceInfo(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>({ exercises: null, usage: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Ensures the count is meaningful even if no data screen has been opened
        // yet; idempotent and warms the catalog for offline use.
        await ensureSeeded();
        const exercises = await countExercises();
        const est = await navigator.storage?.estimate?.();
        const usage = est?.usage != null ? formatBytes(est.usage) : null;
        if (!cancelled) setInfo({ exercises, usage });
      } catch {
        // Offline with no cache yet — leave the rows showing "—".
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
