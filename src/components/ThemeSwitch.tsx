import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '../store';

export function ThemeSwitch() {
  const { isDark, toggleTheme } = useStore((state) => ({
    isDark: state.isDark,
    toggleTheme: state.toggleTheme,
  }));

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );
}