'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Search, MapPin, CheckCircle, ArrowRight, User } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  headline: string;
  district?: string;
  state?: string;
  country: string;
  topics: string[];
  languages: string[];
  available_for_pro_bono: boolean;
}

export default function HomePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [proBonoOnly, setProBonoOnly] = useState(false);

  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, headline, district, state, country, topics, languages, available_for_pro_bono')
        .order('created_at', { ascending: false });

      if (data) setProfiles(data);
      setLoading(false);
    }
    fetchProfiles();
  }, []);

  // Filter countries dynamically for dropdown
  const countries = Array.from(new Set(profiles.map((p) => p.country).filter(Boolean)));

  // Filter logic
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      searchQuery === '' ||
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topics?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCountry = selectedCountry === 'ALL' || p.country.toLowerCase() === selectedCountry.toLowerCase();
    const matchesProBono = !proBonoOnly || p.available_for_pro_bono;

    return matchesSearch && matchesCountry && matchesProBono;
  });

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Find Resource Persons & Speakers
        </h1>
        <p className="mt-3 text-gray-600 text-base">
          An open directory connecting conference organizers, colleges, and communities with domain experts, keynote speakers, and mentors globally.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm mb-8 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        {/* Keyword Search */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, skill, topic (e.g. AI, Cloud, Python)..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Country Filter */}
        <select
          className="w-full sm:w-48 py-2 px-3 border rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          <option value="ALL">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Pro Bono Toggle */}
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer shrink-0 px-2">
          <input
            type="checkbox"
            checked={proBonoOnly}
            onChange={(e) => setProBonoOnly(e.target.checked)}
            className="rounded text-indigo-600 h-4 w-4"
          />
          Pro-Bono Only
        </label>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 font-medium">Loading directory...</div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed rounded-2xl">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">No speakers found matching your search.</p>
          <Link href="/join" className="text-indigo-600 text-sm font-semibold hover:underline mt-2 inline-block">
            Be the first to list yourself →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((speaker) => {
            const location = [speaker.district, speaker.state, speaker.country].filter(Boolean).join(', ');

            return (
              <div
                key={speaker.id}
                className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{speaker.full_name}</h3>
                    {speaker.available_for_pro_bono && (
                      <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        Pro-Bono
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{speaker.headline}</p>

                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{location}</span>
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {speaker.topics?.slice(0, 3).map((topic, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-md font-medium">
                        {topic}
                      </span>
                    ))}
                    {speaker.topics && speaker.topics.length > 3 && (
                      <span className="text-[11px] text-gray-400 self-center">
                        +{speaker.topics.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/speakers/${speaker.id}`}
                  className="flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100 px-3 py-2 rounded-xl transition"
                >
                  View Profile & Works
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}