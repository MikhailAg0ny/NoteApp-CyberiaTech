'use client';

import { Bars3Icon, Cog6ToothIcon, MagnifyingGlassIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import { useTheme } from './ThemeProvider';

interface ConditionalLayoutProps {
  children: ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  const triggerSearch = () => {
    document.dispatchEvent(new CustomEvent("openSearchPanel"));
  };

  const openSettings = () => {
    document.dispatchEvent(new CustomEvent("openSettingsModal"));
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Theme-aware colors
  const isDark = theme === 'dark';
  const bgMain = isDark ? 'bg-[#0d1117]' : 'bg-white';
  const bgHeader = isDark ? 'bg-[#161b22]' : 'bg-white';
  const borderColor = isDark ? 'border-gray-800' : 'border-gray-200';
  const searchBg = isDark ? 'bg-[#0d1117]' : 'bg-[#f1f3f4]';
  const searchHover = isDark ? 'hover:bg-[#161b22]' : 'hover:bg-[#e8eaed]';
  const textColor = isDark ? 'text-gray-400' : 'text-[#5f6368]';
  const textPrimary = isDark ? 'text-white' : 'text-[#3c4043]';
  const iconHover = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100';
  const focusRing = isDark ? 'focus:ring-gray-700' : 'focus:ring-gray-300';
  
  if (isAuthPage) {
    return (
      <div className="w-full h-full flex flex-col bg-[var(--github-bg)] transition-colors">
        <section className="flex-1 overflow-y-auto">{children}</section>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header - Always visible at top */}
      <header className={`h-16 border-b ${borderColor} flex items-center px-4 ${bgHeader} z-50`}>
        {/* Left side - Hamburger Menu & App Name (always visible) */}
        <div className="flex items-center gap-4 min-w-0 mr-4">
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-full ${iconHover} transition-colors`}
            title="Toggle Sidebar"
          >
            <Bars3Icon className={`w-6 h-6 ${textColor}`} />
          </button>
          <div className="flex items-center gap-2">
            <img 
              src={isDark ? "/cyberia.png" : "/cyberia1.png"}
              alt="Cyberia Tech Logo" 
              className="w-auto h-10 object-contain"
            />
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-2xl mx-auto px-4">
          <button
            onClick={triggerSearch}
            className={`w-full flex items-center gap-3 px-4 py-2.5 ${searchBg} ${searchHover} border ${borderColor} rounded-lg ${textColor} text-[14px] transition-all focus:outline-none focus:ring-2 ${focusRing}`}
          >
            <MagnifyingGlassIcon className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Search notes</span>
          </button>
        </div>

        {/* Right side - Action Icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={openSettings}
            className={`p-2 rounded-full ${iconHover} transition-colors`}
            title="Settings"
          >
            <Cog6ToothIcon className={`w-6 h-6 ${textColor}`} />
          </button>
          <button
            className={`p-2 rounded-full ${iconHover} transition-colors`}
            title="Help"
          >
            <QuestionMarkCircleIcon className={`w-6 h-6 ${textColor}`} />
          </button>
        </div>
      </header>

      {/* Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - slides in/out */}
        <Sidebar isOpen={sidebarOpen} />
        
        {/* Main Content */}
        <main className={`flex-1 h-full flex flex-col ${bgMain} transition-colors overflow-hidden`}>
          <section className={`flex-1 overflow-y-auto ${bgMain}`}>
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}