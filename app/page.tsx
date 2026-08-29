'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
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

  // Collect all unique topics from speakers
  const allUniqueTopics = useMemo(() => {
    const topicsSet = new Set<string>();
    speakers.forEach((s) => {
      if (Array.isArray(s.topics)) {
        s.topics.forEach((topic: string) => {
          if (topic.trim()) topicsSet.add(topic.trim());
        });
      }
    });
    return Array.from(topicsSet);
  }, [speakers]);

  // Extract unique countries
  const allUniqueCountries = useMemo(() => {
    const countrySet = new Set<string>();
    speakers.forEach((s) => {
      if (s.country?.trim()) countrySet.add(s.country.trim());
    });
    return Array.from(countrySet);
  }, [speakers]);

  const filteredSpeakers = speakers.filter((s) => {
    const matchesSearch =
      (s.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (s.headline?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (s.bio?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesCountry = selectedCountry === 'All' || s.country === selectedCountry;
    const matchesProBono = !proBonoOnly || s.pro_bono === true;
    const matchesTopic =
      selectedTopic === 'All' ||
      (Array.isArray(s.topics) && s.topics.some((t: string) => t.toLowerCase() === selectedTopic.toLowerCase()));

    return matchesSearch && matchesCountry && matchesProBono && matchesTopic;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
          Find Resource Persons & Speakers
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          An open directory connecting conference organizers, universities, and communities with verified domain experts, keynote speakers, and mentors.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name, title, or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[260px] bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm rounded-xl text-white outline-none focus:border-blue-500 transition"
        />

        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm rounded-xl text-slate-300 outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="All">All Locations</option>
          {allUniqueCountries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-300 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
          <input
            type="checkbox"
            checked={proBonoOnly}
            onChange={(e) => setProBonoOnly(e.target.checked)}
            className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
          />
          Pro-Bono Only
        </label>
      </div>

      {/* Topic Tag Filter Pills */}
      {allUniqueTopics.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-8">
          <span className="text-xs font-semibold text-slate-400 mr-1">Filter by Domain:</span>
          <button
            onClick={() => setSelectedTopic('All')}
            className={`text-xs px-3 py-1 rounded-full font-medium transition ${
              selectedTopic === 'All'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            All Topics
          </button>
          {allUniqueTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(selectedTopic === topic ? 'All' : topic)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                selectedTopic === topic
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              #{topic}
            </button>
          ))}
        </div>
      )}

      {/* Speaker Cards Grid */}
      {loading ? (
        <div className="text-center text-slate-500 py-20 font-medium">Loading speaker directory...</div>
      ) : filteredSpeakers.length === 0 ? (
        <div className="text-center text-slate-400 py-16 bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          <p className="font-semibold text-white mb-1">No speakers found</p>
          <p className="text-xs text-slate-500 mb-4">Try adjusting your filters or search keywords.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedTopic('All');
              setSelectedCountry('All');
              setProBonoOnly(false);
            }}
            className="text-xs text-blue-400 hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpeakers.map((speaker) => (
            <div
              key={speaker.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition flex flex-col justify-between shadow-lg"
            >
              <div>
                {/* Speaker Header */}
                <div className="flex items-start gap-4 mb-4">
                  {speaker.avatar_url ? (
                    <img
                      src={speaker.avatar_url}
                      alt={speaker.name}
                      className="w-14 h-14 rounded-full object-cover border border-slate-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-lg border border-slate-700 flex-shrink-0">
                      {speaker.name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-base font-bold text-white truncate">{speaker.name}</h3>
                      {speaker.pro_bono && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                          Pro-Bono
                        </span>
                      )}
                    </div>
                    <p className="text-blue-400 text-xs font-medium line-clamp-1 mt-0.5">{speaker.headline}</p>
                    {speaker.country && (
                      <p className="text-slate-400 text-[11px] mt-0.5">📍 {speaker.country}</p>
                    )}
                  </div>
                </div>

                {/* Bio Snippet */}
                {speaker.bio && (
                  <p className="text-slate-400 text-xs line-clamp-3 mb-4 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    {speaker.bio}
                  </p>
                )}

                {/* Domain Badges */}
                {Array.isArray(speaker.topics) && speaker.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {speaker.topics.slice(0, 3).map((topic: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedTopic(topic);
                        }}
                        className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md transition"
                      >
                        #{topic}
                      </button>
                    ))}
                    {speaker.topics.length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{speaker.topics.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* View Profile Action */}
              <Link
                href={`/speakers/${speaker.id}`}
                className="w-full text-center bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition border border-slate-700 hover:border-blue-600"
              >
                View Profile & Works →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}