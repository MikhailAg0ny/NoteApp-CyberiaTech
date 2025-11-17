import { Inter, JetBrains_Mono } from 'next/font/google';
import { ReactNode } from "react";
import { ThemeProvider } from './components/ThemeProvider';
import ConditionalLayout from './components/ConditionalLayout';
import "./globals.css";
// Plus Jakarta Sans isn't available in next/font/google so we'll keep using it via CSS

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex h-screen text-[var(--github-text-primary)] bg-[var(--github-bg)] transition-colors overflow-hidden">
        <ThemeProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
