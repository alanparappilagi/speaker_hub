'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('United States');
  const [proBono, setProBono] = useState(false);

  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Check if the user is logged in on mount
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
      setAuthChecking(false);
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Verify user session
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please sign in or create an account first to publish a profile.');
      router.push('/login');
      return;
    }

    // 2. Insert profile linked to this authenticated user
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          name,
          headline,
          bio,
          country,
          pro_bono: proBono,
          user_id: user.id, // Links ownership to Supabase Auth user
        },
      ])
      .select()
      .single();

    if (error) {
      alert('Error creating profile: ' + error.message);
      setLoading(false);
    } else {
      router.push(`/speakers/${data.id}`);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4">
      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl">
        <div className="mb-6">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition">
            ← Back to Directory
          </Link>
          <h1 className="text-2xl font-bold mt-2">Create Speaker Profile</h1>
          <p className="text-sm text-slate-400 mt-1">
            Publish your details so event organizers and communities can reach you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              placeholder="e.g. Sarah Connor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Headline / Role *
            </label>
            <input
              type="text"
              required
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              placeholder="e.g. AI Researcher & Keynote Speaker"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Country *
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="India">India</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Germany">Germany</option>
              <option value="Singapore">Singapore</option>
              <option value="Australia">Australia</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Bio / Topics Covered *
            </label>
            <textarea
              required
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              placeholder="Share your speaking experience, primary domains, and preferred conference formats..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="proBono"
              checked={proBono}
              onChange={(e) => setProBono(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="proBono" className="text-sm text-slate-300 cursor-pointer">
              Available for pro-bono / community / college sessions
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating Profile...' : 'Save & Continue to Portfolio'}
          </button>
        </form>
      </div>
    </div>
  );
}