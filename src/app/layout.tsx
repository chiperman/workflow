import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Workflow Operations',
  description: 'Automated maintenance and synchronization control center.',
};

import { PageBackground } from '@/components/PageBackground';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#fdfcf8] text-[#191919]">
        <PageBackground />
        <div className="relative z-10">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </body>
    </html>
  );
}
