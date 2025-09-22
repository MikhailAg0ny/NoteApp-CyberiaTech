'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  splashDone: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [splashDone, setSplashDone] = useState(false);
  const [splashPhase, setSplashPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('theme') as Theme | null) : null;
    if (stored) setThemeState(stored);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // Splash lifecycle: fade in -> fade out
  useEffect(() => {
    const exitTimer = setTimeout(() => setSplashPhase('out'), 1400); // start fade out
    const doneTimer = setTimeout(() => setSplashDone(true), 2000); // unmount after fade out
    return () => { clearTimeout(exitTimer); clearTimeout(doneTimer); };
  }, []);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, splashDone }}>
      {!splashDone && (
        <div className={`splash-overlay fixed inset-0 flex items-center justify-center z-50 ${splashPhase === 'out' ? 'exit' : ''}`}>
          <div className="splash-content flex flex-col items-center">
            <img src="/logo.svg" alt="Logo" className="splash-logo w-40 h-40 drop-shadow-2xl" />
            <div className="mt-10 h-1.5 w-56 rounded-full overflow-hidden splash-progress">
              <div className="h-full bar" />
            </div>
          </div>
        </div>
      )}
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
