"use client";

import {
  Cog6ToothIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const [notebooks, setNotebooks] = useState<{id:number; name:string}[]>([]);
  const [activeNotebook, setActiveNotebook] = useState<number | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleCreateNoteClick = () => {
    const event = new CustomEvent('openCreateNoteModal');
    document.dispatchEvent(event);
  };

  const openSettings = () => {
    document.dispatchEvent(new CustomEvent('openSettingsModal'));
  };

  const selectNotebook = (id: number | null) => {
    setActiveNotebook(id);
    document.dispatchEvent(new CustomEvent('filterNotebook', { detail: { notebookId: id } }));
  };

  useEffect(() => {
    const fetchNotebooks = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/notebooks`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (res.ok) {
          const data = await res.json();
          setNotebooks(data);
        }
      } catch {}
    };
    fetchNotebooks();
  }, [token, API_BASE]);

  return (
  <aside className="hidden md:flex md:flex-col w-72 bg-surface border-r border-default shadow-lg transition-colors select-none relative">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--github-accent)]/5 via-transparent to-transparent pointer-events-none"></div>
      
      {/* Logo container with more padding and no border */}
      <div className="py-8 px-6 flex items-center justify-center border-b border-default/60 relative z-10">
        <div className="h-12 relative filter drop-shadow-md hover:scale-105 transition-transform cursor-pointer">
          <Image
            src="/logo.svg" 
            alt="CyberiaTech Logo" 
            width={120}
            height={60}
            className="object-contain"
            priority
          />
        </div>
      </div>
      
      {/* Navigation with increased top margin */}
      <nav className="flex-1 p-4 space-y-2 mt-2 relative z-10">
        <div className="mb-4">
          <button
            className="flex items-center justify-center gap-2.5 w-full px-5 py-3.5 rounded-xl bg-gradient-to-r from-[var(--github-accent)] to-[var(--github-accent-hover)] text-white hover:shadow-lg hover:shadow-[var(--github-accent)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--github-accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--github-bg-secondary)] transition-smooth hover:scale-105 active:scale-95 font-semibold text-sm"
            onClick={handleCreateNoteClick}
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Note</span>
          </button>
        </div>
        <div className="space-y-1">
          {[
            { icon: MagnifyingGlassIcon, label: 'Search', badge: null },
            { icon: DocumentTextIcon, label: 'All Notes', badge: null },
            { icon: TrashIcon, label: 'Trash', badge: null }
          ].map(({ icon: Icon, label, badge }) => (
            <button
              key={label}
              type="button"
              className="group flex w-full items-center justify-between px-4 py-3 rounded-lg text-sm text-secondary hover:text-primary hover:bg-[var(--github-border)]/30 transition-smooth relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--github-accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--github-bg-secondary)] overflow-hidden"
            >
              <div className="flex items-center gap-3 relative z-10">
                <Icon className="w-5 h-5 text-secondary group-hover:text-[var(--github-accent)] transition-colors" />
                <span className="font-medium">{label}</span>
              </div>
              {badge && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--github-accent)]/15 text-[var(--github-accent)] text-[10px] font-bold">{badge}</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--github-accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          ))}
        </div>
        {/* Notebooks Section */}
        {notebooks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-default/40">
            <div className="px-4 mb-3 flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider font-bold text-secondary">Notebooks</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface text-secondary font-medium">{notebooks.length}</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => selectNotebook(null)}
                className={`block w-full text-left px-4 py-2.5 text-sm rounded-lg transition-smooth relative overflow-hidden group ${
                  activeNotebook === null 
                    ? 'bg-gradient-to-r from-[var(--github-accent)] to-[var(--github-accent-hover)] text-white font-semibold shadow-lg shadow-[var(--github-accent)]/20' 
                    : 'text-secondary hover:text-primary hover:bg-[var(--github-border)]/30'
                }`}
              >
                <div className="flex items-center gap-2.5 relative z-10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>All Notebooks</span>
                </div>
                {activeNotebook === null && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
                )}
              </button>
              {notebooks.map(nb => (
                <button
                  key={nb.id}
                  onClick={() => selectNotebook(nb.id)}
                  className={`block w-full text-left px-4 py-2.5 text-sm rounded-lg transition-smooth truncate relative overflow-hidden group ${
                    activeNotebook === nb.id 
                      ? 'bg-gradient-to-r from-[var(--github-accent)] to-[var(--github-accent-hover)] text-white font-semibold shadow-lg shadow-[var(--github-accent)]/20' 
                      : 'text-secondary hover:text-primary hover:bg-[var(--github-border)]/30'
                  }`}
                  title={nb.name}
                >
                  <div className="flex items-center gap-2.5 relative z-10">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="truncate">{nb.name}</span>
                  </div>
                  {activeNotebook === nb.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="mt-auto p-4 border-t border-default/60 bg-[var(--github-bg-secondary)]/50 backdrop-blur-sm relative z-10">
        <button 
          onClick={openSettings} 
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-secondary hover:text-primary hover:bg-[var(--github-border)]/30 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--github-accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--github-bg-secondary)] group"
        >
          <Cog6ToothIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
}