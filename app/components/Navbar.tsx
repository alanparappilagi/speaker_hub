'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Check current session
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    checkUser();

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          SpeakerHub
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className={`transition ${pathname === '/' ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Find Speakers
          </Link>

          <Link
            href="/join"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-1.5 rounded-lg transition"
          >
            + Join as Speaker
          </Link>

          {user ? (
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/60 px-3 py-1.5 rounded-lg transition"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}