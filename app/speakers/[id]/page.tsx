'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface SpeakerProfile {
  id: string;
  user_id: string;
  full_name: string;
  title: string;
  bio: string;
  location: string;
  pro_bono: boolean;
  topics: string[];
  avatar_url?: string;
  email: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  event_name: string;
  media_type: 'video' | 'slides' | 'article' | 'photo';
  media_url: string;
  description?: string;
}

interface InquiryItem {
  id: string;
  organizer_name: string;
  organizer_email: string;
  event_details: string;
  created_at: string;
  status: string;
}

export default function SpeakerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const speakerId = resolvedParams.id;

  const [speaker, setSpeaker] = useState<SpeakerProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Invite/Inquiry Modal & Form State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Portfolio Add Modal State
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portTitle, setPortTitle] = useState('');
  const [portEvent, setPortEvent] = useState('');
  const [portMediaType, setPortMediaType] = useState<'video' | 'slides' | 'article' | 'photo'>('video');
  const [portUrl, setPortUrl] = useState('');
  const [portDesc, setPortDesc] = useState('');
  const [submittingPort, setSubmittingPort] = useState(false);

  useEffect(() => {
    async function loadSpeakerData() {
      setLoading(true);

      // 1. Fetch current profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', speakerId)
        .single();

      if (profileData && !profileErr) {
        setSpeaker(profileData);

        // 2. Check ownership
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === profileData.user_id) {
          setIsOwner(true);

          // 3. Fetch Inquiries for owner
          const { data: inqData } = await supabase
            .from('inquiries')
            .select('*')
            .eq('speaker_id', speakerId)
            .order('created_at', { ascending: false });

          if (inqData) {
            setInquiries(
              inqData.map((item) => ({
                ...item,
                status: item.status || 'pending',
              }))
            );
          }
        }
      }

      // 4. Fetch Portfolio Items
      const { data: portData } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('speaker_id', speakerId)
        .order('created_at', { ascending: false });

      if (portData) setPortfolio(portData);

      setLoading(false);
    }

    loadSpeakerData();
  }, [speakerId]);

  // Handle Accept / Decline status updates
  const handleUpdateInquiryStatus = async (inquiryId: string, newStatus: string) => {
    // Optimistic UI update
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === inquiryId ? { ...inq, status: newStatus } : inq))
    );

    const { error } = await supabase
      .from('inquiries')
      .update({ status: newStatus })
      .eq('id', inquiryId);

    if (error) {
      console.error('Failed to update status:', error);
      alert('Could not update status: ' + error.message);
    }
  };

  // Handle sending new speaking invitation
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInquiry(true);

    try {
      // 1. Insert into Supabase
      const { error: dbError } = await supabase.from('inquiries').insert([
        {
          speaker_id: speakerId,
          organizer_name: organizerName,
          organizer_email: organizerEmail,
          event_details: eventDetails,
          status: 'pending',
        },
      ]);

      if (dbError) throw dbError;

      // 2. Send email notification via Resend API Route
      if (speaker?.email) {
        await fetch('/api/send-inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            speakerName: speaker.full_name,
            speakerEmail: speaker.email,
            organizerName,
            organizerEmail,
            sessionDetails: eventDetails,
          }),
        });
      }

      setInquirySuccess(true);
      setTimeout(() => {
        setShowInviteModal(false);
        setInquirySuccess(false);
        setOrganizerName('');
        setOrganizerEmail('');
        setEventDetails('');
      }, 2000);
    } catch (err: any) {
      alert('Failed to send invitation: ' + err.message);
    } finally {
      setSubmittingInquiry(false);
    }
  };

  // Handle adding new portfolio item
  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPort(true);

    const { data, error } = await supabase
      .from('portfolio_items')
      .insert([
        {
          speaker_id: speakerId,
          title: portTitle,
          event_name: portEvent,
          media_type: portMediaType,
          media_url: portUrl,
          description: portDesc,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setPortfolio((prev) => [data, ...prev]);
      setShowPortfolioModal(false);
      setPortTitle('');
      setPortEvent('');
      setPortUrl('');
      setPortDesc('');
    } else {
      alert('Failed to add portfolio item: ' + error?.message);
    }
    setSubmittingPort(false);
  };

  // Handle deleting portfolio item
  const handleDeletePortfolio = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    setPortfolio((prev) => prev.filter((p) => p.id !== itemId));
    await supabase.from('portfolio_items').delete().eq('id', itemId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!speaker) {
    return (
      <div className="max-w-4xl mx-auto my-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Speaker Not Found</h2>
        <p className="text-slate-400 mb-6 text-sm">The speaker profile you are looking for does not exist.</p>
        <Link href="/" className="text-blue-400 hover:underline text-sm font-medium">
          ← Back to Speaker Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Back Link */}
      <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white mb-8 transition">
        ← Back to Directory
      </Link>

      {/* Main Profile Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {speaker.avatar_url ? (
              <img
                src={speaker.avatar_url}
                alt={speaker.full_name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-blue-500/30"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-600/20 border-2 border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-3xl">
                {speaker.full_name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {speaker.full_name}
                </h1>
                {speaker.pro_bono && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                    Pro-Bono
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-300 mb-1">{speaker.title}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                📍 {speaker.location || 'Remote / Worldwide'}
              </p>
            </div>
          </div>

          {!isOwner && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-600/20"
            >
              ✉ Invite / Inquire Speaker
            </button>
          )}
        </div>

        {/* Bio Section */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">About</h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{speaker.bio}</p>
        </div>

        {/* Expertise Topics */}
        {speaker.topics && speaker.topics.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Expertise Topics & Class Domains
            </h2>
            <div className="flex flex-wrap gap-2">
              {speaker.topics.map((t, idx) => (
                <span
                  key={idx}
                  className="text-xs px-3 py-1 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Previous Sessions / Portfolio & Inquiries Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Portfolio Sessions (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Previous Works & Sessions</h2>
            {isOwner && (
              <button
                onClick={() => setShowPortfolioModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shadow-sm"
              >
                + Add Session / Work
              </button>
            )}
          </div>

          {portfolio.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
              No previous speaking sessions or recordings listed yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {portfolio.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.media_type} {item.event_name ? `• ${item.event_name}` : ''}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleDeletePortfolio(item.id)}
                        className="text-slate-500 hover:text-rose-400 text-xs transition"
                        title="Delete session"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{item.description}</p>
                  )}
                  {item.media_url && (
                    <a
                      href={item.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline font-medium"
                    >
                      View Presentation / Recording ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Inquiries Inbox (Owner only) */}
        {isOwner && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight">Received Inquiries</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {inquiries.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">Direct invitation requests submitted by event organizers.</p>

            {inquiries.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                No inquiries received yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {inquiries.map((inq) => {
                  const status = (inq.status || 'pending').toLowerCase();
                  return (
                    <div
                      key={inq.id}
                      className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-white">{inq.organizer_name}</p>
                          <a
                            href={`mailto:${inq.organizer_email}`}
                            className="text-[11px] text-blue-400 hover:underline block"
                          >
                            ✉ {inq.organizer_email}
                          </a>
                        </div>
                        <span
                          className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                            status === 'accepted'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : status === 'declined'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-slate-900 whitespace-pre-line">
                        {inq.event_details}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-500">
                          {new Date(inq.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateInquiryStatus(inq.id, 'accepted')}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition"
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => handleUpdateInquiryStatus(inq.id, 'declined')}
                            className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-semibold transition"
                          >
                            ✕ Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Invite {speaker.full_name}</h2>
            <p className="text-xs text-slate-400 mb-5">
              Submit your event proposal. The speaker will be notified via email and on their dashboard.
            </p>

            {inquirySuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs text-center font-medium">
                ✓ Invitation sent successfully!
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name / Organization</label>
                  <input
                    type="text"
                    required
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="e.g. IEEE Student Branch"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Your Contact Email</label>
                  <input
                    type="email"
                    required
                    value={organizerEmail}
                    onChange={(e) => setOrganizerEmail(e.target.value)}
                    placeholder="organizer@domain.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Session Proposal / Event Details</label>
                  <textarea
                    required
                    rows={4}
                    value={eventDetails}
                    onChange={(e) => setEventDetails(e.target.value)}
                    placeholder="Event date, expected audience size, proposed topic, honorarium/budget details..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
                >
                  {submittingInquiry ? 'Sending...' : 'Submit Speaking Invitation'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Portfolio Item Modal */}
      {showPortfolioModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPortfolioModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Add Previous Work / Session</h2>
            <p className="text-xs text-slate-400 mb-5">
              Highlight keynotes, technical workshops, or panel sessions you have delivered.
            </p>

            <form onSubmit={handleAddPortfolio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Session / Talk Title</label>
                <input
                  type="text"
                  required
                  value={portTitle}
                  onChange={(e) => setPortTitle(e.target.value)}
                  placeholder="e.g. Scaling Next.js on Kubernetes"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event / Organization</label>
                  <input
                    type="text"
                    value={portEvent}
                    onChange={(e) => setPortEvent(e.target.value)}
                    placeholder="e.g. AGM 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Media Type</label>
                  <select
                    value={portMediaType}
                    onChange={(e) => setPortMediaType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="video">Video Recording</option>
                    <option value="slides">Slides / Deck</option>
                    <option value="article">Article / Report</option>
                    <option value="photo">Photo / Certificate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Media / Presentation Link (URL)</label>
                <input
                  type="url"
                  value={portUrl}
                  onChange={(e) => setPortUrl(e.target.value)}
                  placeholder="https://youtube.com/... or https://slideshare.net/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={portDesc}
                  onChange={(e) => setPortDesc(e.target.value)}
                  placeholder="Key takeaways or summary of the talk..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingPort}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
              >
                {submittingPort ? 'Saving...' : 'Save Session to Profile'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}