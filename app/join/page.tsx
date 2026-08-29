'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function JoinPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    headline: '',
    bio: '',
    district: '',
    state: '',
    country: '',
    contact_email: '',
    topics: '',
    languages: '',
    github_url: '',
    linkedin_url: '',
    available_for_pro_bono: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      topics: formData.topics.split(',').map((t) => t.trim()).filter(Boolean),
      languages: formData.languages.split(',').map((l) => l.trim()).filter(Boolean),
    };

    const { data, error } = await supabase.from('profiles').insert([payload]).select().single();

    setLoading(false);
    if (error) {
      alert('Error creating profile: ' + error.message);
    } else {
      router.push(`/speakers/${data.id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Join as a Resource Person</h1>
      <p className="text-gray-600 mb-6">Create your open profile so organizers worldwide can discover and contact you.</p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 border rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name *</label>
          <input
            required
            type="text"
            className="w-full mt-1 p-2 border rounded-md"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Headline / Role *</label>
          <input
            required
            type="text"
            placeholder="e.g. Senior Cloud Architect & Speaker"
            className="w-full mt-1 p-2 border rounded-md"
            value={formData.headline}
            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Email *</label>
          <input
            required
            type="email"
            className="w-full mt-1 p-2 border rounded-md"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          />
        </div>

        {/* Granular Location: District, State, Country */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">District / City *</label>
            <input
              required
              type="text"
              placeholder="e.g. Austin, Munich, Thrissur"
              className="w-full mt-1 p-2 border rounded-md"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State / Region *</label>
            <input
              required
              type="text"
              placeholder="e.g. Texas, Bavaria, Kerala"
              className="w-full mt-1 p-2 border rounded-md"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country *</label>
            <input
              required
              type="text"
              placeholder="e.g. USA, Germany, India"
              className="w-full mt-1 p-2 border rounded-md"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Topics / Expertise (comma-separated)</label>
          <input
            type="text"
            placeholder="e.g. Machine Learning, Cloud Systems, Open Science"
            className="w-full mt-1 p-2 border rounded-md"
            value={formData.topics}
            onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Languages Spoken (comma-separated)</label>
          <input
            type="text"
            placeholder="e.g. English, Spanish, Malayalam, German"
            className="w-full mt-1 p-2 border rounded-md"
            value={formData.languages}
            onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
            <input
              type="url"
              placeholder="https://linkedin.com/in/..."
              className="w-full mt-1 p-2 border rounded-md"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GitHub / Personal Website</label>
            <input
              type="url"
              placeholder="https://github.com/..."
              className="w-full mt-1 p-2 border rounded-md"
              value={formData.github_url}
              onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bio / About You</label>
          <textarea
            rows={4}
            placeholder="Brief summary of your background, research interests, and past speaking experience..."
            className="w-full mt-1 p-2 border rounded-md"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="pro_bono"
            checked={formData.available_for_pro_bono}
            onChange={(e) => setFormData({ ...formData, available_for_pro_bono: e.target.checked })}
            className="h-4 w-4 text-indigo-600 rounded"
          />
          <label htmlFor="pro_bono" className="text-sm text-gray-700">
            Available for free / pro-bono sessions (academic institutions, student clubs, non-profits)
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition mt-4"
        >
          {loading ? 'Creating Profile...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}