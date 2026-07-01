import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { SegmentedControl } from '../../components/ios/SegmentedControl';
import { Chip } from '../../components/ui/Chip';
import { GOAL_LABELS } from '../../engine/schemes';
import { recommendSplitId } from '../../engine/splitSelection';
import type { ExperienceLevel, Goal, InjuryFlag, Sex, UserProfile } from '../../engine/types';
import type { Equipment } from '../../types/exercise';
import { EQUIPMENT, EQUIPMENT_SHORT } from '../../lib/constants';
import { displayToKg, kgToDisplay, cmToFtIn } from '../../lib/units';

const DEFAULT: UserProfile = {
  name: '',
  experience: 'beginner',
  goal: 'general',
  daysPerWeek: 3,
  sessionMinutes: 45,
  injuries: [],
  splitPreference: 'auto',
};

const GOALS: Goal[] = ['general', 'hypertrophy', 'strength', 'fatLoss', 'endurance'];
const EXPERIENCE: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
const SESSION_OPTIONS = [30, 45, 60, 75];
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

interface Props {
  onDone?: () => void;
  submitLabel?: string;
}

export function ProfileForm({ onDone, submitLabel = 'Save Profile' }: Props) {
  const profile = useAppStore((s) => s.profile);
  const units = useAppStore((s) => s.settings.units);
  const splits = useAppStore((s) => s.splits);
  const homeDefault = useAppStore((s) => s.settings.defaultEquipment.home);
  const setProfile = useAppStore((s) => s.setProfile);
  const setHomeEquipment = useAppStore((s) => s.setHomeEquipment);

  const [draft, setDraft] = useState<UserProfile>(profile ?? DEFAULT);
  const [homeEquip, setHomeEquip] = useState<Equipment[]>(homeDefault);

  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

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

  const splitPref = draft.splitPreference ?? 'auto';
  const autoSplitName = splits.find((s) => s.id === recommendSplitId(draft.daysPerWeek))?.name ?? '';

  const weightDisplay =
    draft.bodyweightKg != null ? Math.round(kgToDisplay(draft.bodyweightKg, units)) : '';
  const ftIn = draft.heightCm != null ? cmToFtIn(draft.heightCm) : null;

  function save() {
    setProfile(draft);
    // Bodyweight is always available, so home workouts can never be empty.
    const home: Equipment[] = homeEquip.includes('Body Weight')
      ? homeEquip
      : ['Body Weight', ...homeEquip];
    setHomeEquipment(home);
    onDone?.();
  }

  return (
    <div className="space-y-6">
      <Field label="Name">
        <input
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Your name"
          className="w-full rounded-2xl bg-black/5 px-4 py-3 text-[17px] outline-none placeholder:text-neutral-400 dark:bg-white/10"
        />
      </Field>

      <Field label="Sex">
        <SegmentedControl<Sex>
          value={draft.sex ?? 'male'}
          onChange={(v) => set('sex', v)}
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Age">
          <NumberInput
            value={draft.age}
            onChange={(v) => set('age', v)}
            placeholder="—"
            suffix="yr"
          />
        </Field>
        <Field label={`Height`}>
          <NumberInput
            value={draft.heightCm}
            onChange={(v) => set('heightCm', v)}
            placeholder="—"
            suffix="cm"
          />
          {ftIn && (
            <p className="mt-1 px-1 text-[11px] text-neutral-400">
              {ftIn.ft}′{ftIn.in}″
            </p>
          )}
        </Field>
        <Field label="Weight">
          <NumberInput
            value={typeof weightDisplay === 'number' ? weightDisplay : undefined}
            onChange={(v) =>
              set('bodyweightKg', v == null ? undefined : displayToKg(v, units))
            }
            placeholder="—"
            suffix={units}
          />
        </Field>
      </div>

      <Field label="Experience">
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE.map((e) => (
            <Chip key={e} active={draft.experience === e} onClick={() => set('experience', e)}>
              {e[0].toUpperCase() + e.slice(1)}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Primary goal">
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Chip key={g} active={draft.goal === g} onClick={() => set('goal', g)}>
              {GOAL_LABELS[g]}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label={`Training days · ${draft.daysPerWeek}/week`}>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <Chip key={n} active={draft.daysPerWeek === n} onClick={() => set('daysPerWeek', n)}>
              {n}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Workout split">
        <div className="flex flex-wrap gap-2">
          <Chip active={splitPref === 'auto'} onClick={() => set('splitPreference', 'auto')}>
            Auto
          </Chip>
          {splits.map((s) => (
            <Chip
              key={s.id}
              active={splitPref === s.id}
              onClick={() => set('splitPreference', s.id)}
            >
              {s.name}
            </Chip>
          ))}
        </div>
        {splitPref === 'auto' && autoSplitName && (
          <p className="mt-1 px-1 text-[11px] text-neutral-400">
            Auto picks {autoSplitName} for {draft.daysPerWeek} day{draft.daysPerWeek === 1 ? '' : 's'}/week.
          </p>
        )}
      </Field>

      <Field label="Session length">
        <div className="flex flex-wrap gap-2">
          {SESSION_OPTIONS.map((m) => (
            <Chip key={m} active={draft.sessionMinutes === m} onClick={() => set('sessionMinutes', m)}>
              {m} min
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Equipment at home">
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT.map((eq) => (
            <Chip key={eq} active={homeEquip.includes(eq)} onClick={() => toggleEquip(eq)}>
              {EQUIPMENT_SHORT[eq]}
            </Chip>
          ))}
        </div>
        <p className="mt-1 px-1 text-[11px] text-neutral-400">
          Used for Home workouts. Gym workouts always use every machine. Bodyweight is always on.
        </p>
      </Field>

      <Field label="Injuries to work around">
        <div className="flex flex-wrap gap-2">
          {INJURIES.map(({ flag, label }) => (
            <Chip key={flag} active={draft.injuries.includes(flag)} onClick={() => toggleInjury(flag)}>
              {label}
            </Chip>
          ))}
        </div>
      </Field>

      <button
        onClick={save}
        className="press w-full rounded-2xl bg-coral py-4 text-[17px] font-bold text-white shadow-card"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 px-1 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
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
        placeholder={placeholder}
        className="w-full bg-transparent py-3 text-[17px] outline-none placeholder:text-neutral-400"
      />
      {suffix && <span className="pl-1 text-[13px] text-neutral-400">{suffix}</span>}
    </div>
  );
}
