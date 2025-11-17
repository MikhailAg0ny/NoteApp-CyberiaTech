'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  splashDone: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>('dark');
  const [splashDone, setSplashDone] = useState(true);
  const [splashPhase, setSplashPhase] = useState<'in' | 'out'>('out');

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

  // Splash lifecycle: play once after login when landing on home
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const shouldPlay = pathname === '/' && sessionStorage.getItem('playSplashAfterLogin') === 'true';
    if (!shouldPlay) {
      setSplashDone(true);
      setSplashPhase('out');
      return;
    }

    sessionStorage.removeItem('playSplashAfterLogin');
    setSplashDone(false);
    setSplashPhase('in');
    const exitTimer = setTimeout(() => setSplashPhase('out'), 1400);
    const doneTimer = setTimeout(() => setSplashDone(true), 2000);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [pathname]);

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
