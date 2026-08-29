'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FileText, Video, Plus, Send, ExternalLink, MapPin } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  headline: string;
  bio: string;
  district?: string;
  state?: string;
  country: string;
  contact_email: string;
  topics: string[];
  languages: string[];
  available_for_pro_bono: boolean;
  linkedin_url?: string;
  github_url?: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  event_name: string;
  media_type: 'pdf' | 'video';
  media_url: string;
}

export default function SpeakerProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload/Add state
  const [showAddWork, setShowAddWork] = useState(false);
  const [workTitle, setWorkTitle] = useState('');
  const [eventName, setEventName] = useState('');
  const [mediaType, setMediaType] = useState<'pdf' | 'video'>('video');
  const [videoUrl, setVideoUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Contact form state
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sentMessage, setSentMessage] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).single();
      const { data: works } = await supabase.from('portfolio_items').select('*').eq('speaker_id', id);
      if (prof) setProfile(prof);
      if (works) setPortfolio(works);
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleAddWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let finalMediaUrl = videoUrl;

    if (mediaType === 'pdf' && file) {
      const filePath = `${id}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('portfolio-files').upload(filePath, file);
      if (uploadErr) {
        alert('File upload failed: ' + uploadErr.message);
        setUploading(false);
        return;
      }
      const { data: publicData } = supabase.storage.from('portfolio-files').getPublicUrl(filePath);
      finalMediaUrl = publicData.publicUrl;
    }

    const { data: newWork, error } = await supabase.from('portfolio_items').insert([
      {
        speaker_id: id,
        title: workTitle,
        event_name: eventName,
        media_type: mediaType,
        media_url: finalMediaUrl,
      },
    ]).select().single();

    setUploading(false);
    if (error) {
      alert('Failed to save work: ' + error.message);
    } else if (newWork) {
      setPortfolio([...portfolio, newWork]);
      setShowAddWork(false);
      setWorkTitle('');
      setEventName('');
      setVideoUrl('');
      setFile(null);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const mailto = `mailto:${profile?.contact_email}?subject=Session Invitation from ${encodeURIComponent(senderName)}&body=${encodeURIComponent(`Hi ${profile?.full_name},\n\n${message}\n\nFrom: ${senderName} (${senderEmail})`)}`;
    window.location.href = mailto;
    setSentMessage(true);
  };

  const locationFormatted = [profile?.district, profile?.state, profile?.country].filter(Boolean).join(', ');

  if (loading) return <div className="text-center py-20 font-medium text-gray-500">Loading profile...</div>;
  if (!profile) return <div className="text-center py-20 text-red-500">Resource person not found.</div>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header Info */}
      <div className="bg-white border rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
              {profile.available_for_pro_bono && (
                <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium border border-emerald-200">
                  Pro-Bono Available
                </span>
              )}
            </div>
            <p className="text-lg text-gray-600 mt-1">{profile.headline}</p>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              {locationFormatted}
            </p>
          </div>

          <div className="flex gap-2">
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-600" /> LinkedIn
              </a>
            )}
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-600" /> Website / GitHub
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">Expertise Topics</h2>
          <div className="flex flex-wrap gap-2">
            {profile.topics?.map((topic, i) => (
              <span key={i} className="bg-indigo-50 text-indigo-700 font-medium px-3 py-1 rounded-md text-sm">
                {topic}
              </span>
            ))}
          </div>
        </div>

        {profile.languages?.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">Spoken Languages</h2>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((lang, i) => (
                <span key={i} className="bg-gray-100 text-gray-700 font-medium px-2.5 py-0.5 rounded-md text-xs">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.bio && (
          <div className="mt-4 border-t pt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">About</h2>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{profile.bio}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Previous Works & Slides */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Previous Works & Sessions</h2>
            <button
              onClick={() => setShowAddWork(!showAddWork)}
              className="flex items-center gap-1.5 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-4 h-4" /> {showAddWork ? 'Cancel' : 'Upload Work'}
            </button>
          </div>

          {/* Add Work Form */}
          {showAddWork && (
            <form onSubmit={handleAddWork} className="border border-indigo-200 bg-indigo-50/50 p-5 rounded-xl space-y-4">
              <h3 className="font-semibold text-gray-800">Add Slide Deck, Paper or Talk</h3>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Session / Work Title *</label>
                <input required type="text" className="w-full p-2 border rounded-md bg-white text-sm" value={workTitle} onChange={(e) => setWorkTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Event / Conference Name</label>
                <input type="text" placeholder="e.g. PyCon 2025, University Keynote" className="w-full p-2 border rounded-md bg-white text-sm" value={eventName} onChange={(e) => setEventName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Type</label>
                <select className="w-full p-2 border rounded-md bg-white text-sm" value={mediaType} onChange={(e) => setMediaType(e.target.value as 'pdf' | 'video')}>
                  <option value="video">Recorded Video Link (YouTube / Vimeo)</option>
                  <option value="pdf">PDF Slide Deck / Research Paper</option>
                </select>
              </div>

              {mediaType === 'video' ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Video URL *</label>
                  <input required type="url" placeholder="https://youtube.com/watch?v=..." className="w-full p-2 border rounded-md bg-white text-sm" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Upload PDF File *</label>
                  <input required type="file" accept=".pdf" className="w-full text-sm bg-white p-2 border rounded-md" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                </div>
              )}

              <button type="submit" disabled={uploading} className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-indigo-700 transition">
                {uploading ? 'Saving...' : 'Save & Publish Item'}
              </button>
            </form>
          )}

          {/* Portfolio List */}
          {portfolio.length === 0 ? (
            <div className="border border-dashed rounded-xl p-8 text-center text-gray-400">
              No previous presentations or slide decks uploaded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {portfolio.map((item) => (
                <div key={item.id} className="p-4 border rounded-xl bg-white shadow-sm flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-gray-100 rounded-lg text-gray-600 mt-0.5">
                      {item.media_type === 'pdf' ? <FileText className="w-5 h-5 text-rose-500" /> : <Video className="w-5 h-5 text-indigo-500" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      {item.event_name && <p className="text-xs text-gray-500 mt-0.5">{item.event_name}</p>}
                    </div>
                  </div>
                  <a href={item.media_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md transition shrink-0">
                    {item.media_type === 'pdf' ? 'Download PDF' : 'Watch Talk'}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Contact Inquiry Form */}
        <div>
          <div className="bg-white border rounded-2xl p-6 shadow-sm sticky top-24">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Invite for a Session</h3>
            <p className="text-xs text-gray-500 mb-4">Send a direct proposal or inquiry to {profile.full_name}.</p>

            {sentMessage ? (
              <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg">
                Your email client was opened to complete and send the invitation.
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Your Name</label>
                  <input required type="text" className="w-full p-2 border rounded-md text-sm" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Your Email</label>
                  <input required type="email" className="w-full p-2 border rounded-md text-sm" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Session Details & Date</label>
                  <textarea required rows={4} placeholder="Describe topic, event date, audience, and format (virtual/in-person)..." className="w-full p-2 border rounded-md text-sm" value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md text-sm transition">
                  <Send className="w-4 h-4" /> Send Invitation
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}