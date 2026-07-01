import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarCheck,
  ChevronRight,
  Dumbbell,
  Flame,
  Scale,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import type {
  NotificationIcon,
  NotificationItem,
  NotificationTone,
} from '../../lib/notifications';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';

const ICONS: Record<NotificationIcon, ComponentType<{ className?: string }>> = {
  flame: Flame,
  dumbbell: Dumbbell,
  scale: Scale,
  sparkles: Sparkles,
  trophy: Trophy,
  calendar: CalendarCheck,
};

// Reuses the same soft-badge palette as the rest of the app's stat rows.
const TONE: Record<NotificationTone, string> = {
  coral: 'bg-coral-soft text-coral',
  mint: 'bg-mint/15 text-mint',
  amber: 'bg-peach-soft text-amber',
  lilac: 'bg-lilac-soft text-lilac',
  blue: 'bg-ios-blue/10 text-ios-blue',
};

export function NotificationsScreen() {
  const navigate = useNavigate();
  const { items, readAt, markAllRead } = useNotifications();

  // Snapshot the read cutoff before we clear it, so items that were unread on
  // open keep their "New" marker for this viewing.
  const [seenAt] = useState(readAt);

  // Opening the feed clears the unread badge.
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  return (
    <div className="min-h-full pb-8">
      <PageHeader title="Notifications" onBack={() => navigate(-1)} />
      <div className="space-y-3 px-4 pt-2">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((n) => (
            <NotificationRow
              key={n.id}
              item={n}
              isNew={n.createdAt > seenAt}
              onOpen={n.route ? () => navigate(n.route!) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NotificationRow({
  item,
  isNew,
  onOpen,
}: {
  item: NotificationItem;
  isNew: boolean;
  onOpen?: () => void;
}) {
  const Icon = ICONS[item.icon];
  return (
    <Card className="flex items-center gap-3 p-4" onClick={onOpen}>
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${TONE[item.tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-bold leading-tight">{item.title}</p>
          {isNew && <span className="h-2 w-2 shrink-0 rounded-full bg-coral" />}
        </div>
        <p className="mt-0.5 text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
          {item.body}
        </p>
      </div>
      {onOpen && <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300 dark:text-neutral-600" />}
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-black/5 text-neutral-400 dark:bg-white/10">
        <Bell className="h-7 w-7" />
      </div>
      <p className="mt-4 text-[17px] font-bold">You're all caught up</p>
      <p className="mt-1 text-[14px] text-neutral-500 dark:text-neutral-400">
        Reminders and milestones will show up here.
      </p>
    </div>
  );
}
