'use client';

import { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profile) setProfileId(profile.id);
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', currentUser.id)
          .single();

        if (profile) setProfileId(profile.id);
      } else {
        setProfileId(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfileId(null);
    router.push('/');
    router.refresh();
  };

  return (
    <html lang="en" className="dark">
      <head>
        <title>SpeakUp — Find Resource Persons & Speakers</title>
        <meta
          name="description"
          content="An open directory connecting conference organizers, universities, and communities with verified domain experts, keynote speakers, and mentors."
        />
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col`}>
        {/* Dynamic Global Navbar */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-black text-xl text-white tracking-tight">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              SpeakUp
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 transition"
              >
                Find Speakers
              </Link>

              {user ? (
                <>
                  {profileId ? (
                    <Link
                      href={`/speakers/${profileId}`}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm"
                    >
                      My Profile & Inbox
                    </Link>
                  ) : (
                    <Link
                      href="/join"
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm"
                    >
                      Create Speaker Profile
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 transition border border-slate-800 rounded-lg hover:border-slate-700"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/join"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm"
                  >
                    + Join as Speaker
                  </Link>
                  <Link
                    href="/login"
                    className="text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 transition border border-slate-800 rounded-lg hover:border-slate-700"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} SpeakUp. All rights reserved.
        </footer>
      </body>
    </html>
  );
}