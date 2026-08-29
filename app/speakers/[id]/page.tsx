'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Speaker {
  id: string;
  name: string;
  headline: string;
  bio: string;
  country: string;
  pro_bono: boolean;
  user_id?: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  event_name: string;
  media_type: string;
  media_url: string;
}

export default function SpeakerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const speakerId = resolvedParams.id;

  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form states for adding portfolio items
  const [title, setTitle] = useState('');
  const [eventName, setEventName] = useState('');
  const [mediaType, setMediaType] = useState('slides');
  const [mediaUrl, setMediaUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function initData() {
      // 1. Get logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 2. Fetch speaker details
      const { data: speakerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', speakerId)
        .single();

      if (speakerData) {
        setSpeaker(speakerData);
      }

      // 3. Fetch portfolio items
      fetchPortfolio();
      setLoading(false);
    }

    initData();
  }, [speakerId]);

  const fetchPortfolio = async () => {
    const { data } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('speaker_id', speakerId)
      .order('created_at', { ascending: false });

    if (data) setPortfolio(data);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let finalUrl = mediaUrl;

    // Handle file upload if provided
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${speakerId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('portfolio-files')
        .upload(fileName, file);

      if (uploadError) {
        alert('File upload failed: ' + uploadError.message);
        setSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('portfolio-files')
        .getPublicUrl(fileName);

      finalUrl = publicUrlData.publicUrl;
    }

    // Insert portfolio record
    const { error } = await supabase.from('portfolio_items').insert([
      {
        speaker_id: speakerId,
        title,
        event_name: eventName,
        media_type: mediaType,
        media_url: finalUrl,
      },
    ]);

    if (error) {
      alert('Failed to add item: ' + error.message);
    } else {
      setTitle('');
      setEventName('');
      setMediaUrl('');
      setFile(null);
      fetchPortfolio();
    }
    setSubmitting(false);
  };

  const isOwner = currentUser && speaker && currentUser.id === speaker.user_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (!speaker) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 text-center">
        <p className="text-red-400">Speaker profile not found.</p>
        <Link href="/" className="text-blue-400 underline text-sm mt-4 inline-block">
          Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="text-xs text-slate-400 hover:text-white transition">
          ← Back to Directory
        </Link>

        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{speaker.name}</h1>
              <p className="text-blue-400 text-lg font-medium mt-1">{speaker.headline}</p>
              <p className="text-slate-400 text-sm mt-1">{speaker.country}</p>
            </div>
            {speaker.pro_bono && (
              <span className="bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs px-3 py-1 rounded-full font-medium">
                Pro-Bono Friendly
              </span>
            )}
          </div>

          <div className="mt-6 border-t border-slate-800 pt-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">About</h2>
            <p className="mt-2 text-slate-300 whitespace-pre-line leading-relaxed">{speaker.bio}</p>
          </div>
        </div>

        {/* Public Portfolio Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-4">Past Sessions & Keynotes</h2>
          {portfolio.length === 0 ? (
            <p className="text-slate-500 text-sm">No portfolio items published yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {portfolio.map((item) => (
                <div key={item.id} className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-lg">
                  <span className="text-xs uppercase font-semibold text-blue-400 tracking-wider">
                    {item.media_type}
                  </span>
                  <h3 className="font-semibold text-slate-100 mt-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{item.event_name}</p>
                  {item.media_url && (
                    <a
                      href={item.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      View Resource / Deck ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Protected Upload Form (Only shown if logged-in user owns this profile) */}
        {isOwner && (
          <div className="bg-slate-900 border border-blue-900/60 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-2 text-blue-300">Add Portfolio Item</h2>
            <p className="text-slate-400 text-sm mb-6">
              Only you can see this section to add slides, recordings, or session proof.
            </p>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Talk / Session Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  placeholder="e.g. Scaling Next.js Apps to 1M Users"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Event / Conference Name *</label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  placeholder="e.g. React India 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Media Type</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="slides">Slide Deck</option>
                  <option value="video">Video Recording</option>
                  <option value="article">Article / Recap</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">External Link (YouTube, Drive, Slideshare)</label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Or Upload PDF / Deck File</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-blue-400 hover:file:bg-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
              >
                {submitting ? 'Uploading...' : 'Publish Item to Profile'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}