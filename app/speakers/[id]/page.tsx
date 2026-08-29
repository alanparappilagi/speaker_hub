'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SpeakerDetailPage() {
  const { id } = useParams();
  const [speaker, setSpeaker] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [inquiriesList, setInquiriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Form State (for Visitors)
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDetails, setInviteDetails] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Add Portfolio Modal State
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [workTitle, setWorkTitle] = useState('');
  const [eventName, setEventName] = useState('');
  const [mediaType, setMediaType] = useState('Video Recording');
  const [externalUrl, setExternalUrl] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingWork, setUploadingWork] = useState(false);

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editTopics, setEditTopics] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    async function loadData() {
      // 1. Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 2. Fetch Speaker Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (!profileErr && profileData) {
        setSpeaker(profileData);
        setEditName(profileData.name || '');
        setEditHeadline(profileData.headline || '');
        setEditBio(profileData.bio || '');
        setEditCountry(profileData.country || '');
        setEditTopics(profileData.topics ? profileData.topics.join(', ') : '');
        setEditLinkedin(profileData.linkedin_url || '');
        setEditGithub(profileData.github_url || '');
        setEditAvatarUrl(profileData.avatar_url || '');

        // 3. If the logged in user is the owner, fetch their inquiries inbox
        if (user && user.id === profileData.user_id) {
          const { data: inqData } = await supabase
            .from('inquiries')
            .select('*')
            .eq('speaker_id', profileData.id)
            .order('created_at', { ascending: false });

          if (inqData) {
            setInquiriesList(inqData);
          }
        }
      }

      // 4. Fetch Portfolio Items
      const { data: worksData } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('speaker_id', id)
        .order('created_at', { ascending: false });

      if (worksData) {
        setPortfolio(worksData);
      }

      setLoading(false);
    }

    if (id) loadData();
  }, [id]);

  const isOwner = currentUser && speaker && currentUser.id === speaker.user_id;

  // 1. Send Inquiry (Visitor Handler)
  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingInvite(true);

    // Save record to Supabase
    await supabase.from('inquiries').insert([
      {
        speaker_id: speaker.id,
        organizer_name: inviteName,
        organizer_email: inviteEmail,
        session_details: inviteDetails,
      },
    ]);

    // Construct Mailto for direct communication
    const targetEmail = speaker.contact_email || 'speaker@example.com';
    const subject = encodeURIComponent(`Session Invitation for ${speaker.name} via SpeakerHub`);
    const body = encodeURIComponent(
      `Hello ${speaker.name},\n\nMy name is ${inviteName} (${inviteEmail}).\n\nSession Details & Proposal:\n${inviteDetails}\n\nLooking forward to hearing from you!`
    );

    window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_blank');

    setSendingInvite(false);
    setInviteSuccess(true);
    setInviteName('');
    setInviteEmail('');
    setInviteDetails('');
  };

  // 2. Avatar Photo Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingAvatar(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${speaker.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('portfolio-files')
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data } = supabase.storage.from('portfolio-files').getPublicUrl(filePath);
      setEditAvatarUrl(data.publicUrl);
    }
    setUploadingAvatar(false);
  };

  // 3. Save Edited Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    const topicsArray = editTopics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: editName,
        headline: editHeadline,
        bio: editBio,
        country: editCountry,
        topics: topicsArray,
        linkedin_url: editLinkedin,
        github_url: editGithub,
        avatar_url: editAvatarUrl,
      })
      .eq('id', speaker.id)
      .select()
      .single();

    if (!error && data) {
      setSpeaker(data);
      setShowEditModal(false);
    }
    setSavingProfile(false);
  };

  // 4. Upload New Portfolio Item
  const handleUploadWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingWork(true);

    let finalUrl = externalUrl;

    if (uploadFile) {
      const fileExt = uploadFile.name.split('.').pop();
      const filePath = `work-decks/${speaker.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-files')
        .upload(filePath, uploadFile);

      if (!uploadError) {
        const { data } = supabase.storage.from('portfolio-files').getPublicUrl(filePath);
        finalUrl = data.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from('portfolio_items')
      .insert([
        {
          speaker_id: speaker.id,
          title: workTitle,
          event_name: eventName,
          media_type: mediaType,
          media_url: finalUrl,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setPortfolio([data, ...portfolio]);
      setShowWorkModal(false);
      setWorkTitle('');
      setEventName('');
      setExternalUrl('');
      setUploadFile(null);
    }
    setUploadingWork(false);
  };

  // 5. Delete Portfolio Item
  const handleDeleteWork = async (workId: string) => {
    if (!confirm('Are you sure you want to remove this portfolio entry?')) return;
    const { error } = await supabase.from('portfolio_items').delete().eq('id', workId);
    if (!error) {
      setPortfolio(portfolio.filter((item) => item.id !== workId));
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Loading speaker details...</div>;
  }

  if (!speaker) {
    return (
      <div className="text-center py-20 text-slate-400">
        Speaker not found.{' '}
        <Link href="/" className="text-blue-400 underline">
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Profile Card */}
      <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl mb-8 border border-slate-100">
        <div className="flex flex-col sm:flex-row items-start gap-6 justify-between">
          <div className="flex items-start gap-5">
            {speaker.avatar_url ? (
              <img
                src={speaker.avatar_url}
                alt={speaker.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-2xl border border-slate-300">
                {speaker.name?.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{speaker.name}</h1>
                {speaker.pro_bono && (
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Pro-Bono Available
                  </span>
                )}
              </div>
              <p className="text-slate-600 font-medium mt-1">{speaker.headline}</p>
              {speaker.country && (
                <p className="text-slate-400 text-xs mt-1">📍 {speaker.country}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {speaker.linkedin_url && (
              <a
                href={speaker.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                LinkedIn ↗
              </a>
            )}
            {speaker.github_url && (
              <a
                href={speaker.github_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                Website / GitHub ↗
              </a>
            )}
            {isOwner && (
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3.5 py-1.5 rounded-lg transition font-medium"
              >
                ✎ Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        {speaker.bio && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">About the Speaker</h4>
            <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">{speaker.bio}</p>
          </div>
        )}

        {/* Expertise Topics / Class Domains */}
        {speaker.topics && speaker.topics.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Expertise Topics & Class Domains</h4>
            <div className="flex flex-wrap gap-2">
              {speaker.topics.map((t: string, idx: number) => (
                <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-md font-medium border border-blue-100">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Works (Left) + Inquiries / Invite Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Previous Works & Sessions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Previous Works & Sessions</h2>
            {isOwner && (
              <button
                onClick={() => setShowWorkModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                + Add Session / Work
              </button>
            )}
          </div>

          {portfolio.length === 0 ? (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-sm">
              No previous presentations or slide decks uploaded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {portfolio.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {item.media_type || 'Session'}
                      </span>
                      <span className="text-xs text-slate-400">• {item.event_name}</span>
                    </div>
                    <h3 className="font-semibold text-white text-base">{item.title}</h3>
                    {item.media_url && (
                      <a
                        href={item.media_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline mt-2"
                      >
                        View Presentation / Recording ↗
                      </a>
                    )}
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => handleDeleteWork(item.id)}
                      className="text-slate-500 hover:text-red-400 text-xs px-2 py-1 rounded transition"
                      title="Delete entry"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Inquiries Inbox (for Owner) OR Contact Form (for Visitors) */}
        <div className="bg-white text-slate-900 rounded-2xl p-6 border border-slate-200 h-fit shadow-lg">
          {isOwner ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900">Received Inquiries</h3>
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                  {inquiriesList.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Direct invitation requests submitted by event organizers.</p>

              {inquiriesList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No inquiries received yet. When organizers invite you, their requests will appear here.
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {inquiriesList.map((inq) => (
                    <div key={inq.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{inq.organizer_name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(inq.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <a
                        href={`mailto:${inq.organizer_email}?subject=Re:%20Session%20Invitation`}
                        className="text-blue-600 hover:underline inline-block text-[11px] font-medium"
                      >
                        ✉ {inq.organizer_email}
                      </a>
                      <p className="text-slate-700 text-xs pt-1.5 border-t border-slate-200 whitespace-pre-line leading-relaxed">
                        {inq.session_details}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-bold text-slate-900">Invite for a Session</h3>
              <p className="text-xs text-slate-500 mb-4">Send a direct proposal or inquiry to {speaker.name}.</p>

              {inviteSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs space-y-2">
                  <p className="font-semibold">Inquiry sent successfully!</p>
                  <p>Your message has been logged and your email client was opened to message {speaker.name}.</p>
                  <button
                    onClick={() => setInviteSuccess(false)}
                    className="text-emerald-700 underline font-medium block mt-2"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins (TEDx Organizer)"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="sarah@tedxexample.com"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Session Details & Date</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Describe topic, event date, audience, and format (virtual/in-person)..."
                      value={inviteDetails}
                      onChange={(e) => setInviteDetails(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingInvite}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-sm"
                  >
                    {sendingInvite ? 'Sending...' : '✈ Send Invitation'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Edit Profile */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Speaker Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                />
                {uploadingAvatar && <p className="text-[11px] text-blue-400 mt-1">Uploading picture...</p>}
                {editAvatarUrl && (
                  <img src={editAvatarUrl} alt="Preview" className="w-14 h-14 rounded-full mt-2 object-cover border border-slate-700" />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Headline / Role</label>
                <input
                  type="text"
                  required
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Expertise Topics & Class Domains (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. AI & ML, Cloud Architecture, Leadership, Python"
                  value={editTopics}
                  onChange={(e) => setEditTopics(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Country</label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Bio / About</label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">GitHub / Website</label>
                  <input
                    type="url"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || uploadingAvatar}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Session / Work */}
      {showWorkModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add Session or Portfolio Work</h2>
            <form onSubmit={handleUploadWork} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Talk / Session Title *</label>
                <input
                  type="text"
                  required
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  placeholder="e.g. Scaling Web Architecture with Next.js"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Event / Conference / College Name *</label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. PyCon 2026 / IEEE Summit"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Work / Media Type</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="Video Recording">Video Recording</option>
                  <option value="Slide Deck">Slide Deck (PDF/Slides)</option>
                  <option value="Keynote Presentation">Keynote Presentation</option>
                  <option value="Workshop / Masterclass">Workshop / Masterclass</option>
                  <option value="Certification / Award">Certification / Award</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">External Link (YouTube, Drive, Slideshare)</label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Or Upload PDF / Deck File directly</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWorkModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingWork}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm"
                >
                  {uploadingWork ? 'Publishing...' : 'Publish Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}