import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  Check,
  Dumbbell,
  Flame,
  HeartPulse,
  Trophy,
  Activity,
  Sprout,
  TrendingUp,
  CalendarDays,
  Clock,
  Home,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { SegmentedControl } from '../../components/ios/SegmentedControl';
import { Chip } from '../../components/ui/Chip';
import { recommendSplitId } from '../../engine/splitSelection';
import type {
  ExperienceLevel,
  Goal,
  InjuryFlag,
  Sex,
  UserProfile,
} from '../../engine/types';
import type { Equipment } from '../../types/exercise';
import type { Units } from '../../types/app';
import { EQUIPMENT, EQUIPMENT_SHORT } from '../../lib/constants';
import { displayToKg, kgToDisplay, cmToFtIn } from '../../lib/units';

// The engine only needs goal/experience/days/session/equipment/injuries to build
// a plan; body metrics stay optional (they only refine calorie estimates) and the
// split is left on 'auto' — advanced users can change it later in the full form.
const DEFAULT: UserProfile = {
  name: '',
  experience: 'beginner',
  goal: 'general',
  daysPerWeek: 3,
  sessionMinutes: 45,
  injuries: [],
  splitPreference: 'auto',
};

const GOAL_OPTIONS: { value: Goal; label: string; desc: string; icon: typeof Flame }[] = [
  { value: 'general', label: 'General Fitness', desc: 'Stay fit, healthy and active', icon: Activity },
  { value: 'hypertrophy', label: 'Build Muscle', desc: 'Grow bigger, more defined muscle', icon: Dumbbell },
  { value: 'strength', label: 'Get Stronger', desc: 'Lift heavier over time', icon: Trophy },
  { value: 'fatLoss', label: 'Lose Fat', desc: 'Burn fat and lean out', icon: Flame },
  { value: 'endurance', label: 'Endurance', desc: 'Boost stamina & conditioning', icon: HeartPulse },
];

const EXPERIENCE_OPTIONS: {
  value: ExperienceLevel;
  label: string;
  desc: string;
  icon: typeof Sprout;
}[] = [
  { value: 'beginner', label: 'Beginner', desc: 'New to training or getting back into it', icon: Sprout },
  { value: 'intermediate', label: 'Intermediate', desc: 'Comfortable with the basics', icon: TrendingUp },
  { value: 'advanced', label: 'Advanced', desc: 'Years of consistent training', icon: Trophy },
];

const SESSION_OPTIONS: { value: number; label: string; desc: string }[] = [
  { value: 30, label: '30 min', desc: 'Quick & focused' },
  { value: 45, label: '45 min', desc: 'Balanced session' },
  { value: 60, label: '60 min', desc: 'Full workout' },
  { value: 75, label: '75 min', desc: 'No rush' },
];

const INJURIES: { flag: InjuryFlag; label: string }[] = [
  { flag: 'lowerBack', label: 'Lower back' },
  { flag: 'knee', label: 'Knee' },
  { flag: 'shoulder', label: 'Shoulder' },
  { flag: 'elbow', label: 'Elbow' },
  { flag: 'wrist', label: 'Wrist' },
  { flag: 'neck', label: 'Neck' },
  { flag: 'ankle', label: 'Ankle' },
  { flag: 'hip', label: 'Hip' },
];

const STEP_COUNT = 8;

interface Props {
  /** Called after the profile is saved (first plan will build itself). */
  onDone: () => void;
  /** Called when the user backs out of the very first step. */
  onExit: () => void;
}

/**
 * Guided, one-question-at-a-time coach setup for first-time users. Replaces the
 * intimidating single wall-of-fields form on first run; the full form is still
 * used for later edits (see ProfileScreen).
 */
export function CoachSetup({ onDone, onExit }: Props) {
  const units = useAppStore((s) => s.settings.units);
  const splits = useAppStore((s) => s.splits);
  const homeDefault = useAppStore((s) => s.settings.defaultEquipment.home);
  const setProfile = useAppStore((s) => s.setProfile);
  const setHomeEquipment = useAppStore((s) => s.setHomeEquipment);

  const [draft, setDraft] = useState<UserProfile>(DEFAULT);
  const [homeEquip, setHomeEquip] = useState<Equipment[]>(homeDefault);
  // `dir` drives the slide direction of the step transition (+1 fwd, -1 back).
  const [[step, dir], setStep] = useState<[number, number]>([0, 1]);

  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function go(delta: number) {
    const nextStep = step + delta;
    if (nextStep < 0) return onExit();
    setStep([nextStep, delta >= 0 ? 1 : -1]);
  }

  /** Set a value and immediately advance — used by single-choice steps. */
  function pick<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    set(key, value);
    setStep([step + 1, 1]);
  }

  const toggleInjury = (flag: InjuryFlag) =>
    setDraft((d) => ({
      ...d,
      injuries: d.injuries.includes(flag)
        ? d.injuries.filter((f) => f !== flag)
        : [...d.injuries, flag],
    }));

  const toggleEquip = (eq: Equipment) => {
    if (eq === 'Body Weight') return; // always available at home
    setHomeEquip((cur) => (cur.includes(eq) ? cur.filter((e) => e !== eq) : [...cur, eq]));
  };

  function finish() {
    setProfile(draft);
    const home: Equipment[] = homeEquip.includes('Body Weight')
      ? homeEquip
      : ['Body Weight', ...homeEquip];
    setHomeEquipment(home);
    onDone();
  }

  const autoSplitName =
    splits.find((s) => s.id === recommendSplitId(draft.daysPerWeek))?.name ?? '';

  return (
    <div className="flex min-h-full flex-col pb-safe">
      {/* Header: back + progress bar */}
      <header className="sticky top-0 z-20 bg-app/80 px-4 pb-3 pt-safe backdrop-blur-xl dark:bg-app-dark/80">
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => go(-1)}
            aria-label="Back"
            className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-coral"
              initial={false}
              animate={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-[13px] font-semibold tabular-nums text-neutral-400">
            {step + 1}/{STEP_COUNT}
          </span>
        </div>
      </header>

      {/* Steps */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="px-5 pt-4"
          >
            {step === 0 && (
              <Step
                title="Let's set up your coach"
                subtitle="A few quick questions and we'll build your workouts automatically — on device."
              >
                <label className="mb-1.5 block px-1 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
                  What should we call you?
                </label>
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => set('name', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && go(1)}
                  placeholder="Your name"
                  className="w-full rounded-2xl bg-black/5 px-4 py-3.5 text-[17px] outline-none placeholder:text-neutral-400 dark:bg-white/10"
                />
                <PrimaryButton onClick={() => go(1)}>Continue</PrimaryButton>
              </Step>
            )}

            {step === 1 && (
              <Step title="What's your main goal?" subtitle="This shapes your sets, reps and rest.">
                <div className="space-y-3">
                  {GOAL_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.value}
                      icon={<o.icon className="h-5 w-5" />}
                      label={o.label}
                      desc={o.desc}
                      selected={draft.goal === o.value}
                      onClick={() => pick('goal', o.value)}
                    />
                  ))}
                </div>
              </Step>
            )}

            {step === 2 && (
              <Step
                title="How much experience?"
                subtitle="We'll match the volume and intensity to you."
              >
                <div className="space-y-3">
                  {EXPERIENCE_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.value}
                      icon={<o.icon className="h-5 w-5" />}
                      label={o.label}
                      desc={o.desc}
                      selected={draft.experience === o.value}
                      onClick={() => pick('experience', o.value)}
                    />
                  ))}
                </div>
              </Step>
            )}

            {step === 3 && (
              <Step
                title="How many days a week?"
                subtitle={
                  autoSplitName
                    ? `We'll use a ${autoSplitName} split for ${draft.daysPerWeek} day${draft.daysPerWeek === 1 ? '' : 's'}.`
                    : 'Pick what you can realistically stick to.'
                }
              >
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      onClick={() => pick('daysPerWeek', n)}
                      className={`press flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl text-[22px] font-extrabold transition-colors ${
                        draft.daysPerWeek === n
                          ? 'bg-coral text-white'
                          : 'bg-black/5 text-ink dark:bg-white/10 dark:text-white'
                      }`}
                    >
                      <CalendarDays className="h-4 w-4 opacity-60" />
                      {n}
                    </button>
                  ))}
                </div>
              </Step>
            )}

            {step === 4 && (
              <Step
                title="How long per session?"
                subtitle="We'll fit the plan to your time."
              >
                <div className="space-y-3">
                  {SESSION_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.value}
                      icon={<Clock className="h-5 w-5" />}
                      label={o.label}
                      desc={o.desc}
                      selected={draft.sessionMinutes === o.value}
                      onClick={() => pick('sessionMinutes', o.value)}
                    />
                  ))}
                </div>
              </Step>
            )}

            {step === 5 && (
              <Step
                title="What do you have at home?"
                subtitle="Tap all that apply. Gym days always use every machine."
              >
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT.map((eq) => (
                    <Chip
                      key={eq}
                      active={eq === 'Body Weight' || homeEquip.includes(eq)}
                      onClick={() => toggleEquip(eq)}
                    >
                      {EQUIPMENT_SHORT[eq]}
                    </Chip>
                  ))}
                </div>
                <p className="mt-2 flex items-center gap-1.5 px-1 text-[12px] text-neutral-400">
                  <Home className="h-3.5 w-3.5" /> Bodyweight is always on, so home
                  workouts are never empty.
                </p>
                <PrimaryButton onClick={() => go(1)}>Continue</PrimaryButton>
              </Step>
            )}

            {step === 6 && (
              <AboutStep
                draft={draft}
                units={units}
                onSet={set}
                onContinue={() => go(1)}
                onSkip={() => go(1)}
              />
            )}

            {step === 7 && (
              <Step
                title="Any injuries to work around?"
                subtitle="We'll avoid moves that stress these areas. Skip if none."
              >
                <div className="flex flex-wrap gap-2">
                  {INJURIES.map(({ flag, label }) => (
                    <Chip
                      key={flag}
                      active={draft.injuries.includes(flag)}
                      onClick={() => toggleInjury(flag)}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
                <PrimaryButton onClick={finish}>
                  <Sparkles className="mr-1.5 inline h-4 w-4" />
                  Build my plan
                </PrimaryButton>
              </Step>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-[26px] font-extrabold leading-tight">{title}</h1>
      {subtitle && (
        <p className="mt-1.5 text-[14px] text-neutral-500 dark:text-neutral-400">{subtitle}</p>
      )}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function OptionCard({
  icon,
  label,
  desc,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`press flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${
        selected
          ? 'border-coral bg-coral-soft dark:bg-coral/15'
          : 'border-transparent bg-black/5 dark:bg-white/10'
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          selected ? 'bg-coral text-white' : 'bg-white text-coral dark:bg-white/10'
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-bold leading-tight">{label}</p>
        <p className="mt-0.5 text-[13px] text-neutral-500 dark:text-neutral-400">{desc}</p>
      </div>
      {selected && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral text-white">
          <Check className="h-4 w-4" />
        </div>
      )}
    </button>
  );
}

function AboutStep({
  draft,
  units,
  onSet,
  onContinue,
  onSkip,
}: {
  draft: UserProfile;
  units: Units;
  onSet: <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const weightDisplay =
    draft.bodyweightKg != null ? Math.round(kgToDisplay(draft.bodyweightKg, units)) : undefined;
  const ftIn = draft.heightCm != null ? cmToFtIn(draft.heightCm) : null;

  return (
    <Step
      title="A little about you"
      subtitle="Optional — helps us estimate calories. You can skip this."
    >
      <div className="space-y-5">
        <div>
          <p className="mb-1.5 px-1 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
            Sex
          </p>
          <SegmentedControl<Sex>
            value={draft.sex ?? 'male'}
            onChange={(v) => onSet('sex', v)}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="mb-1.5 px-1 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
              Age
            </p>
            <NumberInput
              value={draft.age}
              onChange={(v) => onSet('age', v)}
              suffix="yr"
            />
          </div>
          <div>
            <p className="mb-1.5 px-1 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
              Height
            </p>
            <NumberInput
              value={draft.heightCm}
              onChange={(v) => onSet('heightCm', v)}
              suffix="cm"
            />
            {ftIn && (
              <p className="mt-1 px-1 text-[11px] text-neutral-400">
                {ftIn.ft}′{ftIn.in}″
              </p>
            )}
          </div>
          <div>
            <p className="mb-1.5 px-1 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
              Weight
            </p>
            <NumberInput
              value={weightDisplay}
              onChange={(v) => onSet('bodyweightKg', v == null ? undefined : displayToKg(v, units))}
              suffix={units}
            />
          </div>
        </div>
      </div>
      <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
      <button
        onClick={onSkip}
        className="press mt-2 w-full py-2 text-[15px] font-semibold text-neutral-400"
      >
        Skip for now
      </button>
    </Step>
  );
}

function PrimaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="press mt-8 w-full rounded-2xl bg-coral py-4 text-[17px] font-bold text-white"
    >
      {children}
    </button>
  );
}

function NumberInput({
  value,
  onChange,
  suffix,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center rounded-2xl bg-black/5 px-3 dark:bg-white/10">
      <input
        inputMode="numeric"
        value={value ?? ''}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) ? n : undefined);
        }}
        placeholder="—"
        className="w-full bg-transparent py-3 text-[17px] outline-none placeholder:text-neutral-400"
      />
      {suffix && <span className="pl-1 text-[13px] text-neutral-400">{suffix}</span>}
    </div>
  );
}
