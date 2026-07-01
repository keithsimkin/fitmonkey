import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { buildNotifications, type NotificationItem } from '../lib/notifications';

export interface NotificationsResult {
  items: NotificationItem[];
  unreadCount: number;
  /** Timestamp the feed was last opened; items newer than this are unread. */
  readAt: number;
  markAllRead: () => void;
}

/**
 * The derived notification feed plus unread bookkeeping. Items are recomputed
 * from store state; an item is "unread" when it was created after the feed was
 * last opened (`notificationsReadAt`).
 */
export function useNotifications(): NotificationsResult {
  const profile = useAppStore((s) => s.profile);
  const logs = useAppStore((s) => s.logs);
  const weightLog = useAppStore((s) => s.weightLog);
  const splits = useAppStore((s) => s.splits);
  const settings = useAppStore((s) => s.settings);
  const readAt = useAppStore((s) => s.notificationsReadAt);
  const markAllRead = useAppStore((s) => s.markNotificationsRead);

  const items = useMemo(
    () => buildNotifications({ profile, logs, weightLog, splits, settings, now: new Date() }),
    [profile, logs, weightLog, splits, settings],
  );

  const unreadCount = useMemo(
    () => items.filter((n) => n.createdAt > readAt).length,
    [items, readAt],
  );

  return { items, unreadCount, readAt, markAllRead };
}
