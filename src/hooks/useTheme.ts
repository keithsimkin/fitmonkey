import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

/**
 * Applies the `dark` class to <html> based on the user's themeMode.
 * 'system' tracks the OS preference live (matchMedia listener).
 */
export function useTheme() {
  const themeMode = useAppStore((s) => s.settings.themeMode);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const dark = themeMode === 'dark' || (themeMode === 'system' && mq.matches);
      root.classList.toggle('dark', dark);
      // Konsta reads this attribute for its dark variants.
      root.classList.toggle('k-ios', true);
    };

    apply();
    if (themeMode === 'system') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [themeMode]);
}
