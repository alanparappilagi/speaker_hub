'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface SpeakerProfile {
  id: string;
  full_name?: string;
  title?: string;
  bio?: string;
  location?: string;
  pro_bono?: boolean;
  topics?: string[];
  avatar_url?: string;
}

export default function HomePage() {
  const [speakers, setSpeakers] = useState<SpeakerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [proBonoOnly, setProBonoOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpeakers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, title, bio, location, pro_bono, topics, avatar_url')
          .order('created_at', { ascending: false });

        if (data && !error) {
          setSpeakers(data);
        }
      } catch (err) {
        console.error('Failed to fetch speakers:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSpeakers();
  }, []);

  const allTopics = ['All', ...Array.from(new Set(speakers.flatMap((s) => s.topics || [])))];

  const filteredSpeakers = speakers.filter((speaker) => {
    const name = speaker.full_name || '';
    const title = speaker.title || '';
    const bio = speaker.bio || '';
    const location = speaker.location || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTopic =
      selectedTopic === 'All' || (speaker.topics && speaker.topics.includes(selectedTopic));

    const matchesProBono = proBonoOnly ? Boolean(speaker.pro_bono) : true;

    return matchesSearch && matchesTopic && matchesProBono;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Open Resource Person & Speaker Network
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
          Connect with Verified Domain Experts & Speakers
        </h1>
        <p className="text-base text-slate-400 mb-8 leading-relaxed">
          Discover top mentors, keynote speakers, and industry professionals for your next conference, technical workshop, or university symposium.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/join"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-blue-600/20 text-sm"
          >
            Create Speaker Profile Now →
          </Link>
          <Link
            href="/login"
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium px-6 py-3 rounded-xl transition border border-slate-800 text-sm"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Search & Topic Filters */}
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl mb-10 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, role, domain, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
            <input
              type="checkbox"
              id="proBonoFilter"
              checked={proBonoOnly}
              onChange={(e) => setProBonoOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="proBonoFilter" className="text-xs text-slate-300 select-none cursor-pointer">
              Pro-Bono Only
            </label>
          </div>
        </div>

        {/* Filter Pills */}
        {allTopics.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
            <span className="text-xs text-slate-500 mr-1 font-medium">Filter by topic:</span>
            {allTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedTopic === topic
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Speakers Directory Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredSpeakers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm">No speakers found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpeakers.map((speaker) => {
            const displayName = speaker.full_name || 'Anonymous Speaker';
            const initial = displayName.charAt(0).toUpperCase() || 'S';

            return (
              <Link
                key={speaker.id}
                href={`/speakers/${speaker.id}`}
                className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {speaker.avatar_url ? (
                        <img
                          src={speaker.avatar_url}
                          alt={displayName}
                          className="w-12 h-12 rounded-full object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-base">
                          {initial}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-white group-hover:text-blue-400 transition text-base">
                          {displayName}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-1">{speaker.title || 'Speaker'}</p>
                      </div>
                    </div>
                    {speaker.pro_bono && (
                      <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                        Pro-Bono
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                    {speaker.bio || 'No bio provided.'}
                  </p>

                  {speaker.topics && speaker.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {speaker.topics.slice(0, 3).map((topic, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 rounded-md"
                        >
                          {topic}
                        </span>
                      ))}
                      {speaker.topics.length > 3 && (
                        <span className="text-[11px] px-2 py-0.5 bg-slate-950 text-slate-500 border border-slate-800 rounded-md">
                          +{speaker.topics.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <span>📍 {speaker.location || 'Remote'}</span>
                  <span className="text-blue-400 group-hover:translate-x-0.5 transition font-medium">
                    View Profile →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}