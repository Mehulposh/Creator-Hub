import { Moon, Sun } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/cn';

export function ThemeToggle({ className }) {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border transition hover:scale-105',
        isDark
          ? 'border-violet-300/15 bg-[#211b31] text-violet-200'
          : 'border-violet-200/40 bg-white text-violet-700 shadow-sm',
        className
      )}
    >
      {isDark ? <Sun size={16}/> : <Moon size={16}/>}
    </button>
  );
}
