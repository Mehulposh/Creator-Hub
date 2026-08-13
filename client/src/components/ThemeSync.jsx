import { useLayoutEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { applyTheme } from '../store/theme';

export function ThemeSync() {
  const theme = useAppStore((s) => s.theme);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return null;
}
