import { JetBrains_Mono, Montserrat } from 'next/font/google';
import { ReactNode } from "react";
import ConditionalLayout from './components/ConditionalLayout';
import { ThemeProvider } from './components/ThemeProvider';
import { WalletProvider } from './contexts/WalletContext';
import "./globals.css";

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata = {
  title: "CyberiaTech",
  description: "Modern notes app",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/cyberia.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${jetbrainsMono.variable}`}>
      <body className="flex h-screen text-[var(--github-text-primary)] bg-[var(--github-bg)] transition-colors overflow-hidden text-base" style={{ fontFamily: 'var(--font-montserrat)' }}>
        <WalletProvider>
          <ThemeProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </ThemeProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
