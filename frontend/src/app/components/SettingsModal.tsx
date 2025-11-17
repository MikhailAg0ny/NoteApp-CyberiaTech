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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--github-bg)]/95 backdrop-blur-md anim-fade-in p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[var(--github-bg-secondary)] border border-[var(--github-border)] rounded-2xl shadow-2xl anim-scale-in gpu-accelerate"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 20px 60px -15px rgba(0,0,0,0.6)"
        }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--github-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--github-accent)] to-[var(--github-accent-hover)] flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--github-text-primary)] tracking-tight">Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--github-text-secondary)] hover:bg-[var(--github-border)]/40 hover:text-[var(--github-text-primary)] transition-smooth active:scale-95">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--github-text-secondary)] mb-4">Appearance</h3>
            <div className="bg-[var(--github-bg)] border-2 border-[var(--github-border)] rounded-xl p-5 hover:border-[var(--github-accent)]/30 transition-smooth">
              <div className="mb-4">
                <p className="text-[var(--github-text-primary)] font-semibold text-base mb-1">Theme Mode</p>
                <p className="text-sm text-[var(--github-text-secondary)]">Choose your preferred color scheme</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border-2 transition-smooth font-medium ${
                    theme === 'light' 
                      ? 'bg-gradient-to-r from-[var(--github-accent)] to-[var(--github-accent-hover)] text-white border-[var(--github-accent)] shadow-lg shadow-[var(--github-accent)]/25' 
                      : 'bg-[var(--github-bg-secondary)] border-[var(--github-border)] text-[var(--github-text-secondary)] hover:text-[var(--github-text-primary)] hover:border-[var(--github-accent)]/30'
                  }`}
                >
                  <SunIcon className="w-5 h-5" /> 
                  <span>Light</span>
                  {theme === 'light' && (
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border-2 transition-smooth font-medium ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-[var(--github-accent)] to-[var(--github-accent-hover)] text-white border-[var(--github-accent)] shadow-lg shadow-[var(--github-accent)]/25' 
                      : 'bg-[var(--github-bg-secondary)] border-[var(--github-border)] text-[var(--github-text-secondary)] hover:text-[var(--github-text-primary)] hover:border-[var(--github-accent)]/30'
                  }`}
                >
                  <MoonIcon className="w-5 h-5" /> 
                  <span>Dark</span>
                  {theme === 'dark' && (
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-3 rounded-lg text-sm border-2 border-[var(--github-border)] text-[var(--github-text-secondary)] hover:text-[var(--github-text-primary)] hover:bg-[var(--github-border)]/40 hover:border-[var(--github-accent)]/30 transition-smooth font-medium"
                >
                  <span>Toggle</span>
                </button>
              </div>
            </div>
          </section>
        </div>
        <div className="px-6 py-5 border-t border-[var(--github-border)] flex justify-end bg-[var(--github-bg-secondary)]/50">
          <button 
            onClick={onClose} 
            className="px-6 py-3 text-sm rounded-lg bg-gradient-to-r from-[var(--github-accent)] to-[var(--github-accent-hover)] hover:shadow-lg hover:shadow-[var(--github-accent)]/35 text-white font-semibold transition-smooth hover:scale-105 active:scale-95"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
