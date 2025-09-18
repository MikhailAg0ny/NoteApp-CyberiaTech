import { Inter, JetBrains_Mono } from 'next/font/google';
import { ReactNode } from "react";
import Sidebar from './components/Sidebar';
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
      <body className="flex h-screen bg-[#0d1117] text-[#c9d1d9]">
        {/* Sidebar as a client component */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 flex flex-col bg-[#0d1117]">
          {/* Page content */}
          <section className="flex-1 overflow-y-auto">{children}</section>
        </main>
      </body>
    </html>
  );
}
