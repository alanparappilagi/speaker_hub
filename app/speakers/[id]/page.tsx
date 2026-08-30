'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  user_id?: string;
  email?: string;
  full_name?: string;
  name?: string;
  title?: string;
  headline?: string;
  bio?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  pro_bono?: boolean;
  topics?: string[];
  avatar_url?: string;
}

interface PortfolioItem {
  id: string;
  speaker_id: string;
  title: string;
  event_name?: string;
  media_type: string;
  media_url?: string;
  description?: string;
  created_at?: string;
}

interface Inquiry {
  id: string;
  speaker_id: string;
  organizer_name: string;
  organizer_email: string;
  event_details?: string;
  message?: string;
  status: string;
  created_at: string;
}

export default function SpeakerDetailPage() {
  const { id } = useParams();
  const profileId = Array.isArray(id) ? id[0] : id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fallback management switch
  const [forceOwnerMode, setForceOwnerMode] = useState(false);

  // Modals
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingWork, setIsAddingWork] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Edit Profile States
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editTopics, setEditTopics] = useState('');
  const [editProBono, setEditProBono] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Add Work States
  const [workTitle, setWorkTitle] = useState('');
  const [workEvent, setWorkEvent] = useState('');
  const [workMediaType, setWorkMediaType] = useState('video');
  const [workUrl, setWorkUrl] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [savingWork, setSavingWork] = useState(false);

  // Inquiry States
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [sendingInquiry, setSendingInquiry] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!profileId) return;
      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      const authUid = authData.user?.id || null;
      setCurrentUserId(authUid);

      // 1. Fetch Profile
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (profData) {
        setProfile(profData);
        setEditName(profData.full_name || profData.name || '');
        setEditTitle(profData.title || profData.headline || '');
        setEditBio(profData.bio || '');
        setEditCity(profData.city || '');
        setEditState(profData.state || '');
        setEditCountry(profData.country || profData.location || '');
        setEditTopics(profData.topics ? profData.topics.join(', ') : '');
        setEditProBono(profData.pro_bono || false);
      }

      // 2. Fetch Works
      const { data: portData } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('speaker_id', profileId)
        .order('created_at', { ascending: false });

      if (portData) setPortfolio(portData);

      // 3. Fetch Inquiries
      const { data: inqData } = await supabase
        .from('inquiries')
        .select('*')
        .eq('speaker_id', profileId)
        .order('created_at', { ascending: false });

      if (inqData) setInquiries(inqData);

      setLoading(false);
    }

    loadData();
  }, [profileId]);

  const isOwner = Boolean(
    forceOwnerMode || (currentUserId && profile && currentUserId === profile.user_id)
  );

  // 1. Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);

    const topicsArray = editTopics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const locationCombined = [editCity, editState, editCountry].filter(Boolean).join(', ') || 'Remote';

    const updates = {
      name: editName,
      full_name: editName,
      title: editTitle,
      headline: editTitle,
      bio: editBio,
      city: editCity || null,
      state: editState || null,
      country: editCountry || 'Remote',
      location: locationCombined,
      topics: topicsArray,
      pro_bono: editProBono,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (error) {
      alert(`Error updating profile: ${error.message}`);
    } else {
      setProfile({ ...profile, ...updates });
      setIsEditing(false);
    }
    setSavingProfile(false);
  };

  // 2. Add Portfolio Item
  const handleAddWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingWork(true);

    const newItem = {
      speaker_id: profile.id,
      title: workTitle,
      event_name: workEvent,
      media_type: workMediaType,
      media_url: workUrl,
      description: workDescription,
    };

    const { data, error } = await supabase
      .from('portfolio_items')
      .insert([newItem])
      .select()
      .single();

    if (error) {
      alert(`Error saving session: ${error.message}`);
    } else if (data) {
      setPortfolio([data, ...portfolio]);
      setWorkTitle('');
      setWorkEvent('');
      setWorkUrl('');
      setWorkDescription('');
      setIsAddingWork(false);
    }
    setSavingWork(false);
  };

  // 3. Delete Portfolio Item
  const handleDeleteWork = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this session?')) return;
    const { error } = await supabase.from('portfolio_items').delete().eq('id', itemId);
    if (!error) {
      setPortfolio(portfolio.filter((p) => p.id !== itemId));
    } else {
      alert(error.message);
    }
  };

  // 4. Update Inquiry Status
  const handleUpdateInquiry = async (inquiryId: string, newStatus: string) => {
    const { error } = await supabase
      .from('inquiries')
      .update({ status: newStatus })
      .eq('id', inquiryId);

    if (!error) {
      setInquiries(inquiries.map((inq) => (inq.id === inquiryId ? { ...inq, status: newStatus } : inq)));
    } else {
      alert(error.message);
    }
  };

  // 5. Send Inquiry
  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSendingInquiry(true);

    const { error } = await supabase.from('inquiries').insert([
      {
        speaker_id: profile.id,
        organizer_name: orgName,
        organizer_email: orgEmail,
        event_details: eventDetails,
        message: eventDetails,
        status: 'pending',
      },
    ]);

    if (error) {
      alert(`Failed to send invitation: ${error.message}`);
    } else {
      setInquirySent(true);
      setOrgName('');
      setOrgEmail('');
      setEventDetails('');

      const { data: updatedInqs } = await supabase
        .from('inquiries')
        .select('*')
        .eq('speaker_id', profile.id)
        .order('created_at', { ascending: false });
      if (updatedInqs) setInquiries(updatedInqs);
    }
    setSendingInquiry(false);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center text-slate-400">
        <div className="inline-block animate-spin text-3xl mb-3">⟳</div>
        <p className="text-sm">Loading speaker profile & sessions...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-black text-white mb-2">Speaker Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">This speaker profile does not exist in the database.</p>
        <Link href="/" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition">
          ← Back to Directory
        </Link>
      </div>
    );
  }

  const displayName = profile.full_name || profile.name || 'Speaker';
  const displayTitle = profile.title || profile.headline || 'Resource Person';
  const displayLocation = [profile.city, profile.state, profile.country].filter(Boolean).join(', ') || profile.location || 'Remote';

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition">
          ← Back to Directory
        </Link>

        <button
          onClick={() => setForceOwnerMode(!forceOwnerMode)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            isOwner
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          {isOwner ? '✓ Management Mode Active' : '⚙ Enable Management Mode'}
        </button>
      </div>

      {/* Main Speaker Card Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shrink-0 shadow-xl border border-slate-700 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black text-white tracking-tight">{displayName}</h1>
                {profile.pro_bono && (
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold rounded-full uppercase tracking-wider">
                    PRO-BONO
                  </span>
                )}
              </div>

              <p className="text-base text-blue-400 font-semibold">{displayTitle}</p>

              <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 pt-1">
                📍 <span>{displayLocation}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {isOwner ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 shadow"
                >
                  ✏️ Edit Profile
                </button>
                <button
                  onClick={() => setIsAddingWork(true)}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  + Add Session / Work
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsInviting(true)}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                ✉ Invite / Inquire Speaker
              </button>
            )}
          </div>
        </div>

        {/* About Section */}
        {profile.bio && (
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">About</h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{profile.bio}</p>
          </div>
        )}

        {/* Expertise Topics */}
        {profile.topics && profile.topics.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
              Expertise Topics & Class Domains
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.topics.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-medium rounded-lg"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Previous Works & Inquiries Dashboard */}
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Previous Works & Sessions
              <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-400 rounded-full font-normal">
                {portfolio.length}
              </span>
            </h2>

            {isOwner && (
              <button
                onClick={() => setIsAddingWork(true)}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition"
              >
                + Add Session
              </button>
            )}
          </div>

          {portfolio.length === 0 ? (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
              <p className="text-sm text-slate-500">No previous speaking sessions or recordings listed yet.</p>
              {isOwner && (
                <button
                  onClick={() => setIsAddingWork(true)}
                  className="mt-4 px-4 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 text-xs font-bold rounded-xl transition"
                >
                  + Add Your First Keynote, Talk or Slides
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-extrabold uppercase tracking-wider">
                        {item.media_type}
                      </span>
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteWork(item.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 p-1 bg-rose-500/10 rounded-md transition"
                          title="Delete Session"
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>

                    {item.event_name && (
                      <p className="text-xs text-blue-400/90 font-medium mb-2">@ {item.event_name}</p>
                    )}

                    {item.description && (
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-3">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {item.media_url && (
                    <div className="pt-3 border-t border-slate-800">
                      <a
                        href={item.media_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:underline"
                      >
                        Open Material / Recording →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Owner Received Inquiries Inbox */}
        {isOwner && (
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📬 Received Inquiries & Invitations
              <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-400 rounded-full font-normal">
                {inquiries.length}
              </span>
            </h2>

            {inquiries.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                No session inquiries received yet. Invitations sent by organizers will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{inq.organizer_name}</p>
                        <a href={`mailto:${inq.organizer_email}`} className="text-xs text-blue-400 hover:underline">
                          {inq.organizer_email}
                        </a>
                      </div>
                      <span
                        className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-full tracking-wider ${
                          inq.status === 'accepted'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : inq.status === 'declined'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {inq.event_details || inq.message}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateInquiry(inq.id, 'accepted')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        ✓ Accept Invitation
                      </button>
                      <button
                        onClick={() => handleUpdateInquiry(inq.id, 'declined')}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Edit Profile */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Edit Speaker Profile</h2>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Headline / Domain Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Thrissur"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    placeholder="e.g. Kerala"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bio / Background</label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expertise Topics (comma-separated)</label>
                <input
                  type="text"
                  value={editTopics}
                  onChange={(e) => setEditTopics(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="proBonoEdit"
                  checked={editProBono}
                  onChange={(e) => setEditProBono(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="proBonoEdit" className="text-xs text-slate-300 cursor-pointer">
                  Available for Pro-Bono (unpaid) college/community talks
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Work */}
      {isAddingWork && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Add Previous Work / Session</h2>
              <button onClick={() => setIsAddingWork(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddWork} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  placeholder="e.g. Modern Data Architecture on AWS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event / Organization</label>
                  <input
                    type="text"
                    value={workEvent}
                    onChange={(e) => setWorkEvent(e.target.value)}
                    placeholder="e.g. IEEE Tech Conclave"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Media Type</label>
                  <select
                    value={workMediaType}
                    onChange={(e) => setWorkMediaType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="video">Video Recording (YouTube/Loom)</option>
                    <option value="slides">Presentation Slides (PDF/Deck)</option>
                    <option value="article">Article / Blog Post</option>
                    <option value="photo">Session Photo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Link / URL</label>
                <input
                  type="url"
                  value={workUrl}
                  onChange={(e) => setWorkUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Summary</label>
                <textarea
                  rows={3}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Key concepts covered, audience level, tools demonstrated..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingWork(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWork}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                >
                  {savingWork ? 'Adding...' : 'Add Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Invite / Inquiry Form */}
      {isInviting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">Invite {displayName}</h2>
                <p className="text-xs text-slate-400">Send an event speaking inquiry</p>
              </div>
              <button onClick={() => setIsInviting(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {inquirySent ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                <p className="text-emerald-400 font-bold text-sm">Session Inquiry Sent!</p>
                <p className="text-xs text-slate-400">
                  The speaker has received your invite. You can close this modal.
                </p>
                <button
                  onClick={() => {
                    setIsInviting(false);
                    setInquirySent(false);
                  }}
                  className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name / Organization *</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. IEEE SB / Tech Community"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Organizer Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    placeholder="organizer@domain.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event Details & Session Topic *</label>
                  <textarea
                    required
                    rows={4}
                    value={eventDetails}
                    onChange={(e) => setEventDetails(e.target.value)}
                    placeholder="Date, session topic, expected audience size, online/offline format..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setIsInviting(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingInquiry}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20"
                  >
                    {sendingInquiry ? 'Sending...' : 'Send Invitation →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}