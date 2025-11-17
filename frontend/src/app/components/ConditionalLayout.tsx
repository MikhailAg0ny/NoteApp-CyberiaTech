'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface ConditionalLayoutProps {
  children: ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Hide sidebar on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  if (isAuthPage) {
    return (
      <div className="w-full h-full flex flex-col bg-[var(--github-bg)] transition-colors">
        <section className="flex-1 overflow-y-auto">{children}</section>
      </div>
    );
  }
  
  return (
    <>
      <Sidebar />
      <main className="flex-1 h-full flex flex-col bg-[var(--github-bg)] transition-colors overflow-hidden">
        <section className="flex-1 overflow-y-auto">{children}</section>
      </main>
    </>
  );
}