import { differenceInCalendarDays, startOfDay } from 'date-fns';
import type { DailyLog, Settings, Split, UserProfile, WeightEntry } from '../types/app';
import {
  deriveStreak,
  getActiveSplit,
  planProgress,
  splitDayById,
  suggestedSplitDay,
} from '../store/selectors';
import { totalCompletedWorkouts } from './stats';
import { dayKey, fromDayKey } from './dates';

export type NotificationTone = 'coral' | 'mint' | 'amber' | 'lilac' | 'blue';
export type NotificationIcon =
  | 'flame'
  | 'dumbbell'
  | 'scale'
  | 'sparkles'
  | 'trophy'
  | 'calendar';

/**
 * One derived, on-device notification. There is no server feed — items are
 * computed from the user's own state (today's plan, streak, logs) each render.
 * `id` is stable per (kind + day) so read-tracking stays consistent, and
 * `createdAt` doubles as sort key and the unread cutoff (see useNotifications).
 */
export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  tone: NotificationTone;
  icon: NotificationIcon;
  route?: string;
}

export interface NotificationInputs {
  profile: UserProfile | null;
  logs: Record<string, DailyLog>;
  weightLog: WeightEntry[];
  splits: Split[];
  settings: Settings;
  now: Date;
}

const WEIGH_IN_STALE_DAYS = 7;
const MILESTONE_EVERY = 10;

/** Derive the current notification feed, newest/most-important first. */
export function buildNotifications({
  profile,
  logs,
  weightLog,
  splits,
  settings,
  now,
}: NotificationInputs): NotificationItem[] {
  const dayStart = startOfDay(now).getTime();
  const key = dayKey(now);

  // Until there's a profile, the only thing worth surfacing is onboarding.
  if (!profile) {
    return [
      {
        id: 'onboarding',
        title: 'Set up your coach',
        body: "Tell us your goals and details — we'll build your workouts automatically.",
        createdAt: dayStart,
        tone: 'coral',
        icon: 'sparkles',
        route: '/profile',
      },
    ];
  }

  const items: NotificationItem[] = [];
  const log = logs[key];
  const activeSplit = getActiveSplit(splits, settings.activeSplitId);
  const splitDay =
    splitDayById(activeSplit, log?.splitDayId ?? null) ?? suggestedSplitDay(activeSplit, now);
  const isRest = splitDay?.isRest ?? false;
  const progress = planProgress(log);
  const doneToday = progress.total > 0 && progress.done === progress.total;

  // --- Today's session ---------------------------------------------------
  if (isRest) {
    items.push({
      id: `rest-${key}`,
      title: 'Rest day',
      body: 'Recovery is part of the plan — take it easy and come back stronger.',
      createdAt: dayStart,
      tone: 'mint',
      icon: 'calendar',
    });
  } else if (doneToday) {
    items.push({
      id: `done-${key}`,
      title: 'Workout complete 🎉',
      body: "You finished today's session. Great work — check your stats.",
      createdAt: log?.completedAt ?? dayStart,
      tone: 'mint',
      icon: 'trophy',
      route: '/stats',
    });
  } else if (log?.startedAt) {
    const left = progress.total - progress.done;
    items.push({
      id: `resume-${key}`,
      title: 'Finish your workout',
      body:
        left > 0
          ? `${left} exercise${left === 1 ? '' : 's'} left in today's session.`
          : "Wrap up today's session.",
      createdAt: log.startedAt,
      tone: 'coral',
      icon: 'dumbbell',
      route: '/workout',
    });
  } else {
    items.push({
      id: `ready-${key}`,
      title: "Today's workout is ready",
      body: splitDay ? `Your ${splitDay.name} session is planned. Let's go!` : "Your session is planned. Let's go!",
      createdAt: dayStart,
      tone: 'coral',
      icon: 'dumbbell',
      route: '/workout',
    });
  }

  // --- Streak at risk: only while today's workout is still open ----------
  const streak = deriveStreak(logs, now);
  if (streak > 0 && !isRest && !doneToday) {
    items.push({
      id: `streak-${key}`,
      title: `Keep your ${streak}-day streak alive 🔥`,
      body: 'Train today so your streak keeps climbing.',
      createdAt: dayStart - 1_000,
      tone: 'amber',
      icon: 'flame',
      route: '/workout',
    });
  }

  // --- Milestone: every Nth completed workout, tied to the latest one ----
  const totalWorkouts = totalCompletedWorkouts(logs);
  if (totalWorkouts > 0 && totalWorkouts % MILESTONE_EVERY === 0) {
    const lastCompletedAt = Object.values(logs).reduce(
      (max, l) => Math.max(max, l.completedAt ?? 0),
      0,
    );
    items.push({
      id: `milestone-${totalWorkouts}`,
      title: `${totalWorkouts} workouts done 🏆`,
      body: 'Another milestone in the books. Keep the momentum going!',
      createdAt: lastCompletedAt || dayStart,
      tone: 'lilac',
      icon: 'trophy',
      route: '/stats',
    });
  }

  // --- Weight logging reminder: never logged, or a week stale ------------
  const lastWeighKey = weightLog.length ? weightLog[weightLog.length - 1].dayKey : null;
  const staleWeight =
    !lastWeighKey || differenceInCalendarDays(now, fromDayKey(lastWeighKey)) >= WEIGH_IN_STALE_DAYS;
  if (staleWeight) {
    items.push({
      id: `weigh-${key}`,
      title: 'Log your weight',
      body: lastWeighKey
        ? "It's been a week — log your weight to keep your trend accurate."
        : 'Track your progress by logging your first weigh-in.',
      createdAt: dayStart - 2_000,
      tone: 'blue',
      icon: 'scale',
      route: '/stats',
    });
  }

  return items.sort((a, b) => b.createdAt - a.createdAt);
}
