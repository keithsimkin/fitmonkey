import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DailyLog,
  DailyPlan,
  DayMode,
  DayStatus,
  Settings,
  SetEntry,
  Split,
  UserProfile,
  WeightEntry,
} from '../types/app';
import type { Equipment } from '../types/exercise';
import { HOME_EQUIPMENT, EQUIPMENT } from '../lib/constants';
import { BUILT_IN_SPLITS, DEFAULT_ACTIVE_SPLIT_ID } from '../data/mappings';
import { resolveActiveSplitId } from '../engine/splitSelection';
import { todayKey } from '../lib/dates';

const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  units: 'kg',
  activeSplitId: DEFAULT_ACTIVE_SPLIT_ID,
  defaultEquipment: {
    home: [...HOME_EQUIPMENT],
    gym: [...EQUIPMENT],
  },
  startWeekday: 1,
  onboarded: false,
  sound: true,
};

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  experience: 'beginner',
  goal: 'general',
  daysPerWeek: 3,
  sessionMinutes: 45,
  injuries: [],
  splitPreference: 'auto',
};

/** True when two equipment lists hold the same set, order-independent. */
function sameEquipment(a: Equipment[], b: Equipment[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((e) => set.has(e));
}

function newLog(dayKey: string, settings: Settings): DailyLog {
  return {
    dayKey,
    status: 'unset',
    mode: 'home',
    equipment: [...settings.defaultEquipment.home],
    splitDayId: null,
    exercises: [],
    completedAt: null,
  };
}

interface AppState {
  settings: Settings;
  splits: Split[];
  logs: Record<string, DailyLog>;
  profile: UserProfile | null;
  weightLog: WeightEntry[];
  notificationsReadAt: number; // ms epoch the notification feed was last opened

  // log helpers
  ensureLog: (dayKey: string) => DailyLog;
  patchLog: (dayKey: string, patch: Partial<DailyLog>) => void;
  setMode: (dayKey: string, mode: DayMode) => void;
  setStatus: (dayKey: string, status: DayStatus) => void;
  setDayEquipment: (dayKey: string, equipment: Equipment[]) => void;
  setSplitDay: (dayKey: string, splitDayId: string | null) => void;
  setExerciseSets: (dayKey: string, exerciseId: string, sets: SetEntry[]) => void;
  removeExercise: (dayKey: string, exerciseId: string) => void;
  setPlan: (dayKey: string, plan: DailyPlan) => void;
  startSession: (dayKey: string) => void;
  completeDay: (dayKey: string) => void;

  // splits
  upsertSplit: (split: Split) => void;
  deleteSplit: (id: string) => void;
  setActiveSplit: (id: string) => void;

  // profile
  setProfile: (patch: Partial<UserProfile>) => void;
  clearProfile: () => void;

  // bodyweight tracking
  logWeight: (kg: number, dayKey?: string) => void;
  removeWeight: (dayKey: string) => void;

  // settings
  updateSettings: (patch: Partial<Settings>) => void;
  setHomeEquipment: (equipment: Equipment[]) => void;
  resetAll: () => void;

  // notifications
  markNotificationsRead: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      splits: BUILT_IN_SPLITS,
      logs: {},
      profile: null,
      weightLog: [],
      notificationsReadAt: 0,

      ensureLog: (dayKey) => {
        const existing = get().logs[dayKey];
        if (existing) return existing;
        const created = newLog(dayKey, get().settings);
        set((s) => ({ logs: { ...s.logs, [dayKey]: created } }));
        return created;
      },

      patchLog: (dayKey, patch) =>
        set((s) => {
          const base = s.logs[dayKey] ?? newLog(dayKey, s.settings);
          return { logs: { ...s.logs, [dayKey]: { ...base, ...patch } } };
        }),

      setMode: (dayKey, mode) =>
        set((s) => {
          const base = s.logs[dayKey] ?? newLog(dayKey, s.settings);
          // Switching mode reseeds the day's equipment from that mode's defaults.
          return {
            logs: {
              ...s.logs,
              [dayKey]: {
                ...base,
                mode,
                equipment: [...s.settings.defaultEquipment[mode]],
              },
            },
          };
        }),

      setStatus: (dayKey, status) => get().patchLog(dayKey, { status }),
      setDayEquipment: (dayKey, equipment) => get().patchLog(dayKey, { equipment }),
      setSplitDay: (dayKey, splitDayId) => get().patchLog(dayKey, { splitDayId }),

      setExerciseSets: (dayKey, exerciseId, sets) =>
        set((s) => {
          const base = s.logs[dayKey] ?? newLog(dayKey, s.settings);
          const others = base.exercises.filter((e) => e.exerciseId !== exerciseId);
          const exercises =
            sets.length === 0
              ? others
              : [...others, { exerciseId, sets }];
          return { logs: { ...s.logs, [dayKey]: { ...base, exercises } } };
        }),

      removeExercise: (dayKey, exerciseId) =>
        set((s) => {
          const base = s.logs[dayKey];
          if (!base) return {};
          return {
            logs: {
              ...s.logs,
              [dayKey]: {
                ...base,
                exercises: base.exercises.filter((e) => e.exerciseId !== exerciseId),
              },
            },
          };
        }),

      setPlan: (dayKey, plan) => get().patchLog(dayKey, { plan }),

      startSession: (dayKey) =>
        set((s) => {
          const base = s.logs[dayKey] ?? newLog(dayKey, s.settings);
          if (base.startedAt) return {}; // keep the original start time
          return { logs: { ...s.logs, [dayKey]: { ...base, startedAt: Date.now() } } };
        }),

      completeDay: (dayKey) =>
        get().patchLog(dayKey, { status: 'workout', completedAt: Date.now() }),

      upsertSplit: (split) =>
        set((s) => {
          const idx = s.splits.findIndex((sp) => sp.id === split.id);
          if (idx === -1) return { splits: [...s.splits, split] };
          const next = s.splits.slice();
          next[idx] = split;
          return { splits: next };
        }),

      deleteSplit: (id) =>
        set((s) => {
          const next = s.splits.filter((sp) => sp.id !== id);
          const activeSplitId =
            s.settings.activeSplitId === id
              ? next[0]?.id ?? DEFAULT_ACTIVE_SPLIT_ID
              : s.settings.activeSplitId;
          return { splits: next, settings: { ...s.settings, activeSplitId } };
        }),

      setActiveSplit: (id) =>
        set((s) => ({ settings: { ...s.settings, activeSplitId: id } })),

      setProfile: (patch) =>
        set((s) => {
          const profile = { ...(s.profile ?? DEFAULT_PROFILE), ...patch };
          // Honor an explicit split choice; fall back to the days/week recommendation.
          const activeSplitId = resolveActiveSplitId(
            profile.splitPreference,
            profile.daysPerWeek,
            s.splits.map((sp) => sp.id),
          );
          // If the split changed, drop today's not-yet-started plan so the new
          // routine regenerates instead of leaving a stale workout in place.
          let logs = s.logs;
          if (activeSplitId !== s.settings.activeSplitId) {
            const tKey = todayKey();
            const today = s.logs[tKey];
            if (today && !today.startedAt) {
              logs = { ...s.logs, [tKey]: { ...today, splitDayId: null, plan: undefined } };
            }
          }
          return {
            profile,
            logs,
            settings: { ...s.settings, activeSplitId, onboarded: true },
          };
        }),

      clearProfile: () => set({ profile: null }),

      logWeight: (kg, dayKey) =>
        set((s) => {
          const key = dayKey ?? todayKey();
          const others = s.weightLog.filter((w) => w.dayKey !== key);
          return {
            weightLog: [...others, { dayKey: key, kg }].sort((a, b) =>
              a.dayKey.localeCompare(b.dayKey),
            ),
          };
        }),

      removeWeight: (dayKey) =>
        set((s) => ({ weightLog: s.weightLog.filter((w) => w.dayKey !== dayKey) })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setHomeEquipment: (equipment) =>
        set((s) => {
          const defaultEquipment = { ...s.settings.defaultEquipment, home: equipment };
          const settings = { ...s.settings, defaultEquipment };
          if (sameEquipment(s.settings.defaultEquipment.home, equipment)) {
            return { settings };
          }
          // Reflect the new home kit on today's not-yet-started home session by
          // reseeding its equipment and dropping the stale plan so it regenerates.
          const tKey = todayKey();
          const today = s.logs[tKey];
          if (today && today.mode === 'home' && !today.startedAt) {
            return {
              settings,
              logs: { ...s.logs, [tKey]: { ...today, equipment, plan: undefined } },
            };
          }
          return { settings };
        }),

      resetAll: () =>
        set({
          settings: DEFAULT_SETTINGS,
          splits: BUILT_IN_SPLITS,
          logs: {},
          profile: null,
          weightLog: [],
          notificationsReadAt: 0,
        }),

      markNotificationsRead: () => set({ notificationsReadAt: Date.now() }),
    }),
    {
      name: 'workout-app-state',
      version: 4,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<AppState>;
        if (version < 2) {
          // v1 had no profile / bodyweight tracking; add them, keep logs intact.
          if (state.profile === undefined) state.profile = null;
          if (state.weightLog === undefined) state.weightLog = [];
        }
        if (version < 3 && state.settings && state.settings.sound === undefined) {
          // v2 had no sound preference; default it on.
          state.settings.sound = true;
        }
        if (version < 4 && state.notificationsReadAt === undefined) {
          // v3 had no notification feed; start with everything unread.
          state.notificationsReadAt = 0;
        }
        return state as AppState;
      },
    },
  ),
);
