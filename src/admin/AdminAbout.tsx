import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AboutData } from '../types';
import { Save, CheckCircle } from 'lucide-react';

const DEFAULT: AboutData = {
  heading: 'Hi, Jovanka here!',
  paragraph: `I am Jovanka Alexandro, a bachelor of Software Engineering student.\n\nMy passion for software lies with dreaming up ideas and making them come true with elegant interfaces. I take great care in experience, architecture, and code quality of the things I build.\n\nI am also an open-source enthusiast and maintainer. You can see list of my projects here. I love how collaboration and knowledge sharing happens through open-source, and I am happy to see what I do could eventually feedback to the community and industry.\n\nOutside of programming, I enjoy reading books. I love the pleasure and excitement of gaining new knowledge other than programming from the books I read.`,
};

const AdminAbout: React.FC = () => {
  const [form, setForm] = useState<AboutData>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'about'));
        if (snap.exists()) setForm(snap.data() as AboutData);
      } catch {
        // use default
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'about'), { ...form, updatedAt: Date.now() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      alert('Failed to save: ' + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-100 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-40 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#333333] mb-1">Edit About Section</h2>
        <p className="text-sm text-[#888]">This content appears on your main About page.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#444] mb-2">Heading</label>
          <input
            type="text"
            value={form.heading}
            onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#444] mb-2">
            Paragraph{' '}
            <span className="text-gray-400 font-normal">(separate paragraphs with blank line)</span>
          </label>
          <textarea
            value={form.paragraph}
            onChange={(e) => setForm((f) => ({ ...f, paragraph: e.target.value }))}
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all resize-none leading-relaxed"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 shadow-md"
        >
          {saved ? (
            <>
              <CheckCircle size={17} />
              Saved!
            </>
          ) : (
            <>
              <Save size={17} />
              {saving ? 'Saving...' : 'Save Changes'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminAbout;
