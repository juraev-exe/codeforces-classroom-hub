import './globals.css';
import { Navbar } from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Codeforces Classroom Hub',
  description: 'Manage and analyze teacher & student Codeforces performance, classes, and contests',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-background text-zinc-100">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-border py-6 text-center text-xs text-zinc-500">
          Codeforces Classroom Hub &copy; 2026 &bull; Real-time competitive programming telemetry & Telegram integration
        </footer>
      </body>
    </html>
  );
}
