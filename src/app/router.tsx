/* eslint-disable react/only-export-components --
   This is the route-config module, not a component file: it intentionally exports
   the `router` alongside lazily-imported screen components. Fast Refresh N/A here. */
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { TabLayout } from './TabLayout';

// Screens are code-split and lazily loaded so the initial bundle stays small and
// each route's chunk is fetched on demand. The shell (RootLayout/TabLayout) stays
// eager so the chrome renders instantly; a skeleton fills in while a chunk loads.
const HomeScreen = lazy(() =>
  import('../screens/home/HomeScreen').then((m) => ({ default: m.HomeScreen })),
);
const DiscoverScreen = lazy(() =>
  import('../screens/discover/DiscoverScreen').then((m) => ({ default: m.DiscoverScreen })),
);
const CategoryScreen = lazy(() =>
  import('../screens/discover/CategoryScreen').then((m) => ({ default: m.CategoryScreen })),
);
const StatsScreen = lazy(() =>
  import('../screens/stats/StatsScreen').then((m) => ({ default: m.StatsScreen })),
);
const SettingsScreen = lazy(() =>
  import('../screens/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
);
const ProfileScreen = lazy(() =>
  import('../screens/profile/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
);
const WorkoutScreen = lazy(() =>
  import('../screens/workout/WorkoutScreen').then((m) => ({ default: m.WorkoutScreen })),
);
const NotificationsScreen = lazy(() =>
  import('../screens/notifications/NotificationsScreen').then((m) => ({
    default: m.NotificationsScreen,
  })),
);
const IntervalTimerScreen = lazy(() =>
  import('../screens/timer/IntervalTimerScreen').then((m) => ({ default: m.IntervalTimerScreen })),
);
const HistoryScreen = lazy(() =>
  import('../screens/history/HistoryScreen').then((m) => ({ default: m.HistoryScreen })),
);
const LoginScreen = lazy(() =>
  import('../screens/auth/LoginScreen').then((m) => ({ default: m.LoginScreen })),
);

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <TabLayout />,
        children: [
          { index: true, element: <HomeScreen /> },
          { path: 'discover', element: <DiscoverScreen /> },
          { path: 'stats', element: <StatsScreen /> },
          { path: 'settings', element: <SettingsScreen /> },
        ],
      },
      // Full-screen routes (no tab bar).
      { path: 'discover/:key', element: <CategoryScreen /> },
      { path: 'profile', element: <ProfileScreen /> },
      { path: 'notifications', element: <NotificationsScreen /> },
      { path: 'history', element: <HistoryScreen /> },
      { path: 'workout', element: <WorkoutScreen /> },
      { path: 'timer', element: <IntervalTimerScreen /> },
      { path: 'login', element: <LoginScreen /> },
    ],
  },
]);
