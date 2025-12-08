'use client';

import { Bars3Icon, ChevronDownIcon, Cog6ToothIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import { useTheme } from './ThemeProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface ConditionalLayoutProps {
  children: ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
      window.location.href = "/login";
    }
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
  const bgDropdown = isDark ? 'bg-gray-900' : 'bg-white';
  const borderDropdown = isDark ? 'border-gray-700' : 'border-gray-200';

  // Load user profile
  const loadProfile = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setProfileLoading(true);

    const email = localStorage.getItem("user_email");
    const name = localStorage.getItem("user_name");
    if (email) {
      setUserProfile({ name: name || email.split("@")[0], email });
      setProfileLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const profileName = data.name || data.email?.split("@")[0] || "User";
        if (data.email) {
          localStorage.setItem("user_email", data.email);
          localStorage.setItem("user_name", profileName);
          setUserProfile({ name: profileName, email: data.email });
        }
      } else {
        setUserProfile(null);
      }
    } catch {
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    loadProfile();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "user_email" || event.key === "user_name") {
        loadProfile();
      }
    };
    const handleAuthLogin = () => loadProfile();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("auth:login", handleAuthLogin);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("auth:login", handleAuthLogin);
    };
  }, [loadProfile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                document.dispatchEvent(new CustomEvent("searchNotes", { detail: { query: value } }));
              }}
              placeholder="Search notes"
              className={`w-full pl-10 pr-3 py-2.5 ${searchBg} ${searchHover} border ${borderColor} rounded-lg ${textColor} text-[14px] transition-all focus:outline-none focus:ring-2 ${focusRing}`}
            />
          </div>
        </div>

        {/* Right side - Action Icons */}
        <div className="flex items-center gap-2">
          {/* User Profile Dropdown */}
          {(userProfile || profileLoading) && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full ${iconHover} transition-colors`}
                title="User Menu"
              >
                <UserCircleIcon className={`w-6 h-6 ${textColor}`} />
                <div className="hidden md:flex flex-col items-start">
                  <span className={`text-sm font-medium ${textPrimary}`}>
                    {userProfile?.name ?? 'Loading…'}
                  </span>
                  <span className={`text-xs ${textColor}`}>
                    {userProfile?.email ?? 'Fetching profile'}
                  </span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 ${textColor} transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-48 ${bgDropdown} border ${borderDropdown} rounded-lg shadow-2xl overflow-hidden`}>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      openSettings();
                    }}
                    className={`w-full text-left px-4 py-3 ${textPrimary} hover:bg-[var(--github-danger)]/10 transition-colors flex items-center gap-2`}
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`w-full text-left px-4 py-3 ${textPrimary} hover:bg-[var(--github-danger)]/10 hover:text-[var(--github-danger)] transition-colors flex items-center gap-2`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Settings Button */}
          {/* Removed: standalone settings button now redundant */}
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