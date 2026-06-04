import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Achievement, AchievementType } from '../types';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';

const TYPES: AchievementType[] = [
  'Juara 1', 'Juara 2', 'Juara 3',
  'Favorite 1', 'Favorite 2', 'Favorite 3',
  'Awardee', 'Participant', 'Sertifikat Kompetensi',
];

const EMPTY: Omit<Achievement, 'id' | 'createdAt'> = {
  type: 'Juara 1',
  competitionName: '',
  year: '',
  organizer: '',
  link: '',
};

const AdminAchievement: React.FC = () => {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Achievement | null }>({
    open: false,
    editing: null,
  });
  const [form, setForm] = useState<Omit<Achievement, 'id' | 'createdAt'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'achievements'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Achievement)));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setModal({ open: true, editing: null });
  };

  const openEdit = (item: Achievement) => {
    setForm({ type: item.type, competitionName: item.competitionName, year: item.year || '', organizer: item.organizer || '', link: item.link || '' });
    setModal({ open: true, editing: item });
  };

  const handleSave = async () => {
    if (!form.competitionName.trim()) return alert('Competition name is required.');
    setSaving(true);
    try {
      if (modal.editing?.id) {
        await updateDoc(doc(db, 'achievements', modal.editing.id), { ...form });
      } else {
        await addDoc(collection(db, 'achievements'), { ...form, createdAt: Date.now() });
      }
      await fetchAll();
      setModal({ open: false, editing: null });
    } catch (e: any) {
      alert('Failed to save: ' + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this achievement?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'achievements', id));
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert('Failed to delete.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#333333]">Achievements</h2>
          <p className="text-sm text-[#888] mt-1">{items.length} total entries</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
        >
          <Plus size={16} /> Add Achievement
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          No achievements yet. Click "Add Achievement" to get started.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <span className="inline-block text-xs font-bold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full mb-1.5">
                  {item.type}
                </span>
                <p className="font-semibold text-[#333333] text-sm">{item.competitionName}</p>
                {(item.year || item.organizer) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[item.year, item.organizer].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>
              <div className="flex gap-2 ml-4 flex-shrink-0">
                <button
                  onClick={() => openEdit(item)}
                  className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => item.id && handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#333333] text-lg">
                {modal.editing ? 'Edit Achievement' : 'Add Achievement'}
              </h3>
              <button onClick={() => setModal({ open: false, editing: null })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#444] mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AchievementType }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                >
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#444] mb-1.5">Competition Name *</label>
                <input
                  type="text"
                  value={form.competitionName}
                  onChange={(e) => setForm((f) => ({ ...f, competitionName: e.target.value }))}
                  placeholder="e.g. National Coding Competition 2024"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#444] mb-1.5">Year</label>
                  <input
                    type="text"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                    placeholder="2024"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#444] mb-1.5">Organizer</label>
                  <input
                    type="text"
                    value={form.organizer}
                    onChange={(e) => setForm((f) => ({ ...f, organizer: e.target.value }))}
                    placeholder="Organizer name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#444] mb-1.5">
                  Link Certificate{' '}
                  <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="url"
                  value={form.link || ''}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  placeholder="https://example.com/certificate"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal({ open: false, editing: null })}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-[#555] text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
              >
                <Save size={15} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAchievement;
