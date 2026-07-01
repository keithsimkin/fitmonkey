import { Bell } from 'lucide-react';
import { Avatar } from './Avatar';

interface Props {
  name: string;
  subtitle?: string;
  badgeCount?: number;
  onAvatar?: () => void;
  onBell?: () => void;
}

export function GreetingHeader({
  name,
  subtitle = 'Welcome Back',
  badgeCount,
  onAvatar,
  onBell,
}: Props) {
  return (
    <div className="flex items-center gap-3 px-4 pt-2">
      <button onClick={onAvatar} className="press">
        <Avatar name={name} size={46} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400">{subtitle}</p>
        <p className="truncate text-[19px] font-bold leading-tight">
          {name || 'Athlete'} <span className="align-middle">👋</span>
        </p>
      </div>
      <button
        onClick={onBell}
        className="press relative flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.07] bg-white dark:border-white/10 dark:bg-surface-dark"
      >
        <Bell className="h-5 w-5" />
        {badgeCount != null && badgeCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>
    </div>
  );
}
