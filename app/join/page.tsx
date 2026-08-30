'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function JoinSpeakerPage() {
  const router = useRouter();

  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Speaker profile fields
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [proBono, setProBono] = useState(false);
  const [topicsInput, setTopicsInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegisterAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error('Registration failed. Please try again.');

      // Parse comma-separated topics
      const topicsArray = topicsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // 2. Insert Profile row in Supabase with backward-compatible column mappings
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: user.id,
            email: user.email,
            full_name: fullName,
            name: fullName,
            title: title,
            headline: title,
            bio,
            location: location || 'Remote',
            pro_bono: proBono,
            topics: topicsArray,
            avatar_url: avatarUrl || null,
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      // 3. Navigate directly to their newly created speaker dashboard
      router.push(`/speakers/${newProfile.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during profile creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
            Speaker Registration
          </span>
          <h1 className="text-3xl font-black text-white mt-3 tracking-tight">
            Create Your Speaker Profile
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Join the open directory to receive session invites from universities, conferences, and event organizers.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegisterAndCreate} className="space-y-5">
          {/* Account Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Account Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Create Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800"></div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alan Parappil"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Professional Title / Headline *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Cloud Architect & Tech Speaker"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Speaker Bio / Background *
            </label>
            <textarea
              required
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Detail your expertise, key industry experience, past talks, and session delivery style..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Location / City
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kochi, Kerala (or Remote)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Avatar / Photo URL (Optional)
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Expertise Topics (Comma Separated) *
            </label>
            <input
              type="text"
              required
              value={topicsInput}
              onChange={(e) => setTopicsInput(e.target.value)}
              placeholder="e.g. AI & ML, Cloud Computing, DevOps, Next.js, Cyber Security"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <input
              type="checkbox"
              id="proBonoCheck"
              checked={proBono}
              onChange={(e) => setProBono(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="proBonoCheck" className="text-xs text-slate-300 cursor-pointer select-none">
              <span className="font-semibold text-white">Available for Pro-Bono sessions</span> (Open to unpaid college/community talks)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Creating Your Profile...' : 'Complete Profile & Join →'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have a speaker account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline font-semibold">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}