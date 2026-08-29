'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [proBonoOnly, setProBonoOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSpeakers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSpeakers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const filteredSpeakers = speakers.filter((s) => {
    const matchesSearch =
      (s.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (s.headline?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (s.bio?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesCountry = selectedCountry === 'All' || s.country === selectedCountry;
    const matchesProBono = !proBonoOnly || s.pro_bono === true;

    return matchesSearch && matchesCountry && matchesProBono;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-3">
          Find Resource Persons & Speakers
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm">
          An open directory connecting conference organizers, colleges, and communities with domain experts, keynote speakers, and mentors globally.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex flex-wrap gap-3 items-center mb-10">
        <input
          type="text"
          placeholder="Search by name, skill, topic (e.g. AI, Cloud, Python)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[240px] bg-slate-950 border border-slate-800 px-4 py-2 text-sm rounded-xl text-white outline-none focus:border-blue-500"
        />

        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="bg-slate-950 border border-slate-800 px-3 py-2 text-sm rounded-xl text-slate-300 outline-none"
        >
          <option value="All">All Countries</option>
          <option value="India">India</option>
          <option value="United States">United States</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="United Arab Emirates">United Arab Emirates</option>
        </select>

        <label className="flex items-center gap-2 text-xs text-slate-300 px-2 cursor-pointer">
          <input
            type="checkbox"
            checked={proBonoOnly}
            onChange={(e) => setProBonoOnly(e.target.checked)}
            className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
          />
          Pro-Bono Only
        </label>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="text-center text-slate-500 py-16">Loading directory...</div>
      ) : filteredSpeakers.length === 0 ? (
        <div className="text-center text-slate-500 py-16 bg-slate-900/30 border border-slate-800 rounded-2xl">
          No speakers found. Be the first to <Link href="/join" className="text-blue-400 hover:underline">join as a speaker</Link>!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSpeakers.map((speaker) => (
            <div
              key={speaker.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{speaker.name}</h3>
                  {speaker.pro_bono && (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium">
                      Pro-Bono
                    </span>
                  )}
                </div>
                <p className="text-blue-400 text-sm font-medium mb-2">{speaker.headline}</p>
                {speaker.country && (
                  <p className="text-slate-400 text-xs flex items-center gap-1 mb-4">
                    📍 {speaker.country}
                  </p>
                )}
                {speaker.bio && (
                  <p className="text-slate-300 text-xs line-clamp-3 mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    {speaker.bio}
                  </p>
                )}
              </div>

              <Link
                href={`/speakers/${speaker.id}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 transition"
              >
                View Profile & Works &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}