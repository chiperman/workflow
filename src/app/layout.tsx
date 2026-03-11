import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Workflow Operations',
  description: 'Automated maintenance and synchronization control center.',
};

import { PageBackground } from '@/components/PageBackground';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body className="antialiased min-h-screen bg-[#fdfcf8] text-[#191919]">
        <TooltipProvider>
          <PageBackground />
          <div className="relative z-10">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
          <Toaster position="top-center" richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
