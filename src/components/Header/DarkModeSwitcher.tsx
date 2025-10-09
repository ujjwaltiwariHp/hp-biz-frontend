'use client';

import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

const useColorMode = () => {
  const [colorMode, setMode] = useState<'light' | 'dark'>('light');

  const setColorMode = (newMode: 'light' | 'dark') => {
    setMode(newMode);

    if (typeof window !== 'undefined') {
      localStorage.setItem('color-theme', newMode);
      document.documentElement.classList.remove(newMode === 'dark' ? 'light' : 'dark');
      document.documentElement.classList.add(newMode);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedTheme = localStorage.getItem('color-theme') as 'light' | 'dark';

    const preferredMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    const initialMode = storedTheme || preferredMode;

    if (initialMode) {
      setMode(initialMode);
      document.documentElement.classList.add(initialMode);
      document.documentElement.classList.remove(initialMode === 'dark' ? 'light' : 'dark');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem('color-theme')) {
            setColorMode(e.matches ? 'dark' : 'light');
        }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return [colorMode, setColorMode] as const;
};

const DarkModeSwitcher = () => {
  const [colorMode, setColorMode] = useColorMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentMode = mounted ? colorMode : 'light';

  return (
    <li>
      <label
        className={`relative m-0 block h-7.5 w-14 rounded-full ${
          currentMode === 'dark' ? 'bg-primary' : 'bg-stroke'
        }`}
      >
        <input
          type="checkbox"
          onChange={() => {
            if (typeof setColorMode === 'function') {
              setColorMode(colorMode === 'light' ? 'dark' : 'light');
            }
          }}
          className="dur absolute top-0 z-50 m-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className={`absolute left-[3px] top-1/2 flex h-6 w-6 -translate-y-1/2 translate-x-0 items-center justify-center rounded-full bg-white shadow-switcher duration-75 ease-linear ${
            currentMode === 'dark' && '!right-[3px] !translate-x-full'
          }`}
        >
          <span className="dark:hidden">
            <Sun width="16" height="16" />
          </span>
          <span className="hidden dark:inline-block">
            <Moon width="16" height="16" />
          </span>
        </span>
      </label>
    </li>
  );
};

export default DarkModeSwitcher;
