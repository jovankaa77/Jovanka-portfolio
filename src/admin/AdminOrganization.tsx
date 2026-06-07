import React, { useEffect, useState, useMemo } from 'react';
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc,
  doc, orderBy, query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Organization } from '../types';
import { Plus, Pencil, Trash2, X, Save, Briefcase, Search } from 'lucide-react';

const EMPTY: Omit<Organization, 'id' | 'createdAt'> = {
  name: '',
  position: '',
  from: '',
  until: '',
};

const AdminOrganization: React.FC = () => {
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; editing: Organization | null }>({ open: false, editing: null });
  const [form, setForm] = useState<Omit<Organization, 'id' | 'createdAt'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'organizations'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Organization)));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.position.toLowerCase().includes(q) ||
        o.from.toLowerCase().includes(q) ||
        o.until.toLowerCase().includes(q),
    );
  }, [items, search]);

  const openCreate = () => {
    setForm(EMPTY);
    setModal({ open: true, editing: null });
  };

  const openEdit = (item: Organization) => {
    setForm({ name: item.name, position: item.position, from: item.from, until: item.until });
    setModal({ open: true, editing: item });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Nama organisasi wajib diisi.');
    if (!form.position.trim()) return alert('Jabatan wajib diisi.');
    if (!form.from.trim()) return alert('Tahun mulai wajib diisi.');
    if (!form.until.trim()) return alert('Tahun selesai wajib diisi.');
    setSaving(true);
    try {
      if (modal.editing?.id) {
        await updateDoc(doc(db, 'organizations', modal.editing.id), { ...form });
      } else {
        await addDoc(collection(db, 'organizations'), { ...form, createdAt: Date.now() });
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
    if (!confirm('Hapus organisasi ini?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'organizations', id));
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      alert('Failed to delete: ' + (e?.message || e));
    } finally {
      setDeleting(null);
    }
  };

  const field = (label: string, key: keyof typeof form, placeholder: string) => (
    <div>
      <label className="block text-sm font-medium text-[#444] mb-1.5">{label}</label>
      <input
        type="text"
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#333333]">Organizations</h2>
          <p className="text-sm text-[#888] mt-1">{items.length} total organisasi</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, jabatan, atau tahun..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all bg-white"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada organisasi. Klik "Tambah" untuk memulai.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((org) => (
            <div key={org.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase size={18} className="text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#333333] text-sm truncate">{org.name}</p>
                <p className="text-xs text-sky-600 font-medium mt-0.5">{org.position}</p>
                <p className="text-xs text-gray-400 mt-0.5">{org.from} — {org.until}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(org)} className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg transition-colors">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => org.id && handleDelete(org.id)}
                  disabled={deleting === org.id}
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
                {modal.editing ? 'Edit Organisasi' : 'Tambah Organisasi'}
              </h3>
              <button onClick={() => setModal({ open: false, editing: null })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {field('Nama Organisasi *', 'name', 'Contoh: BEM Fakultas...')}
              {field('Jabatan *', 'position', 'Contoh: Ketua Divisi...')}
              <div className="grid grid-cols-2 gap-4">
                {field('Dari (tahun) *', 'from', 'Contoh: 2022')}
                {field('Sampai (tahun) *', 'until', 'Contoh: 2023 / Present')}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setModal({ open: false, editing: null })}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-[#555] text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
              >
                <Save size={15} />
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrganization;
