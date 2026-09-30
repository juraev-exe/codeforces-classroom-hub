import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Codeforces Classroom Hub | Live Student Telemetry',
  description: 'Track student problem solving, contest ratings, and Codeforces telemetry in real-time.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ fontSize: "14.5px" }}>
      <body className="min-h-screen bg-background text-zinc-100 antialiased selection:bg-blue-500/30 selection:text-blue-200">
        <Sidebar />
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="mt-auto border-t border-white/[0.06] py-6 text-center text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-zinc-400">Codeforces Classroom Hub</span>
                <span className="text-zinc-600">&bull;</span>
                <span>Personal Telemetry Cockpit</span>
              </div>
              <p className="text-zinc-500 text-[11px]">
                Direct Codeforces API sync &bull; Zero login &bull; 2026 Modern Dashboard
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
