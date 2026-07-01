import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { setFeedbackEnabled } from '../lib/audioCue';
import { PageSkeleton } from '../components/ui/Skeleton';

/** Applies the theme, requests persistent storage, and hosts the router outlet. */
export function RootLayout() {
  useTheme();
  const sound = useAppStore((s) => s.settings.sound);

  // Keep the audio/haptics module in sync with the user's Sounds preference.
  useEffect(() => {
    setFeedbackEnabled(sound);
  }, [sound]);

  useEffect(() => {
    // Ask the browser to keep our cached data (exercise GIFs, app state) durable.
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      {/* Fallback for full-screen routes while their lazy chunk loads. */}
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
