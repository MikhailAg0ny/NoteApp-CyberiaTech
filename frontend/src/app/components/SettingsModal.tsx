'use client';
import { XMarkIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { useTheme } from './ThemeProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, toggleTheme, setTheme } = useTheme();

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm anim-fade-in p-4">
      <div className="w-full max-w-lg bg-[var(--github-bg-secondary)] border border-[var(--github-border)] rounded-xl shadow-xl anim-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--github-border)]">
          <h2 className="text-lg font-semibold text-[var(--github-text-primary)] tracking-tight">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-md text-[var(--github-text-secondary)] hover:bg-[var(--github-border)]/40 hover:text-[var(--github-text-primary)] transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--github-text-secondary)] mb-3">Appearance</h3>
            <div className="flex items-center justify-between bg-[var(--github-bg)] border border-[var(--github-border)] rounded-lg p-4">
              <div>
                <p className="text-[var(--github-text-primary)] font-medium">Theme</p>
                <p className="text-sm text-[var(--github-text-secondary)]">Switch between light and dark mode</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border transition ${theme === 'light' ? 'bg-[var(--github-accent)] text-white border-[var(--github-accent)]' : 'bg-[var(--github-bg-secondary)] border-[var(--github-border)] text-[var(--github-text-secondary)] hover:text-[var(--github-text-primary)]'}`}
                >
                  <SunIcon className="w-4 h-4" /> Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border transition ${theme === 'dark' ? 'bg-[var(--github-accent)] text-white border-[var(--github-accent)]' : 'bg-[var(--github-bg-secondary)] border-[var(--github-border)] text-[var(--github-text-secondary)] hover:text-[var(--github-text-primary)]'}`}
                >
                  <MoonIcon className="w-4 h-4" /> Dark
                </button>
                <button
                  onClick={toggleTheme}
                  className="ml-2 px-3 py-1.5 rounded-md text-sm border border-[var(--github-border)] text-[var(--github-text-secondary)] hover:text-[var(--github-text-primary)] hover:bg-[var(--github-border)]/40"
                >Toggle</button>
              </div>
            </div>
          </section>
        </div>
        <div className="px-5 py-4 border-t border-[var(--github-border)] flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-[var(--github-accent)] hover:bg-[var(--github-accent-hover)] text-white font-medium transition">Close</button>
        </div>
      </div>
    </div>
  );
}
