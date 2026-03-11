import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Workflow Operations',
  description: 'Automated maintenance and synchronization control center.',
};

import { PageBackground } from '@/components/PageBackground';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('font-sans', inter.variable)}>
      <body className="antialiased">
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
