import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Solar Ops Admin',
  description: 'Solar Operations Management Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
