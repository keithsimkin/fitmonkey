import { Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Compass, Home, Settings } from 'lucide-react';
import type { ComponentType } from 'react';
import { PageSkeleton } from '../components/ui/Skeleton';

interface Tab {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}

const TABS: Tab[] = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/discover', label: 'Discover', Icon: Compass },
  { to: '/stats', label: 'Stats', Icon: BarChart3 },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export function TabLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <div className="flex h-full flex-col">
      <div className="no-scrollbar flex-1 overflow-y-auto pb-[calc(96px+var(--sab))]">
        {/* Keep the tab bar visible while a tab's lazy chunk loads. */}
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[calc(12px+var(--sab))]">
        <div className="flex w-full max-w-md items-stretch gap-1 rounded-[26px] bg-white/95 p-1.5 shadow-nav backdrop-blur-xl dark:bg-surface-dark/95">
          {TABS.map(({ to, label, Icon }) => {
            const active = isActive(to);
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-[20px] py-2 transition-colors ${
                  active ? 'bg-coral/10' : ''
                }`}
              >
                <Icon
                  className={active ? 'h-6 w-6 text-coral' : 'h-6 w-6 text-neutral-400'}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={
                    active
                      ? 'text-[10px] font-bold text-coral'
                      : 'text-[10px] font-medium text-neutral-400'
                  }
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
