import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpeakUp — Find Resource Persons & Speakers',
  description:
    'An open directory connecting conference organizers, universities, and communities with verified domain experts, keynote speakers, and mentors.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} SpeakUp. All rights reserved.
        </footer>
      </body>
    </html>
  );
}