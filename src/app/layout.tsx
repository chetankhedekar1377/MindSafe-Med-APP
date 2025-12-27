import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppShell } from '@/components/AppShell';
import { Toaster } from "@/components/ui/toaster";
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Clarity Care',
  description: 'Your personal health tracking assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
        )}
      >
        <div className="flex flex-col min-h-screen">
          <AppShell>{children}</AppShell>
          <Toaster />
          <footer className="p-4 md:p-6 text-center text-xs text-muted-foreground mt-auto">
            <p>
              Clarity Care is an informational tool and not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
            <p className="mt-2">
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
