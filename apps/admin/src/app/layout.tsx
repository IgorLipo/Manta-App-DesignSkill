import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Solar Ops Admin',
  description: 'Solar Operations Management Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-text antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
