import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc,
  doc, orderBy, query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BlogPost } from '../types';
import {
  Plus, Pencil, Trash2, X, Save, Globe, Bold, Italic,
  Heading1, Heading2, List, Image as ImageIcon, Upload, Search,
} from 'lucide-react';

const EMPTY: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  content: '',
  coverImage: '',
  link: '',
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const compressImage = (file: File, maxDim = 1200, quality = 0.72): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });

/* ── Rich Text Editor ── */
const RichEditor: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || '');
  };

  const handleImageInsert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await compressImage(file, 1000, 0.68);
      exec('insertHTML', `<img src="${base64}" alt="blog-image" style="max-width:100%;border-radius:12px;margin:8px 0;" />`);
    } catch {
      alert('Gagal membaca gambar.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const tools = [
    { icon: <Bold size={15} />, cmd: 'bold', title: 'Bold' },
    { icon: <Italic size={15} />, cmd: 'italic', title: 'Italic' },
    { icon: <Heading1 size={15} />, cmd: 'formatBlock', val: 'H1', title: 'Heading 1' },
    { icon: <Heading2 size={15} />, cmd: 'formatBlock', val: 'H2', title: 'Heading 2' },
    { icon: <List size={15} />, cmd: 'insertUnorderedList', title: 'List' },
  ];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-sky-400">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {tools.map((t) => (
          <button
            key={t.title}
            type="button"
            title={t.title}
            onMouseDown={(e) => { e.preventDefault(); exec(t.cmd, t.val); }}
            className="p-2 rounded-lg text-[#555] hover:bg-gray-200 hover:text-sky-600 transition-colors"
          >
            {t.icon}
          </button>
        ))}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageInsert} />
        <button
          type="button"
          title="Insert Image"
          onMouseDown={(e) => { e.preventDefault(); fileRef.current?.click(); }}
          disabled={uploading}
          className="p-2 rounded-lg text-[#555] hover:bg-gray-200 hover:text-sky-600 transition-colors disabled:opacity-50 flex items-center gap-1 text-xs"
        >
          <ImageIcon size={15} />
          {uploading ? ' Memproses…' : ''}
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
        className="min-h-[200px] p-4 text-[#333333] text-sm leading-relaxed focus:outline-none
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:text-[#222]
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:text-[#333]
          [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-2
          [&_em]:italic [&_strong]:font-bold
          [&_img]:max-w-full [&_img]:rounded-xl"
      />
    </div>
  );
};

/* ── Main Component ── */
const AdminBlog: React.FC = () => {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; editing: BlogPost | null }>({ open: false, editing: null });
  const [form, setForm] = useState<Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost)));
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
    return items.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDate = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }).toLowerCase().includes(q)
        : false;
      return matchTitle || matchDate;
    });
  }, [items, search]);

  const openCreate = () => {
    setForm(EMPTY);
    setModal({ open: true, editing: null });
  };

  const openEdit = (item: BlogPost) => {
    setForm({ title: item.title, content: item.content, coverImage: item.coverImage || '', link: item.link || '' });
    setModal({ open: true, editing: item });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const base64 = await compressImage(file);
      setForm((f) => ({ ...f, coverImage: base64 }));
    } catch {
      alert('Gagal membaca gambar cover.');
    } finally {
      setCoverUploading(false);
      if (coverRef.current) coverRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Title is required.');
    setSaving(true);
    try {
      if (modal.editing?.id) {
        await updateDoc(doc(db, 'blogs', modal.editing.id), { ...form, updatedAt: Date.now() });
      } else {
        await addDoc(collection(db, 'blogs'), { ...form, createdAt: Date.now(), updatedAt: Date.now() });
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
    if (!confirm('Delete this blog post?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'blogs', id));
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      alert('Failed to delete: ' + (e?.message || e));
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (ts?: number) =>
    ts ? new Date(ts).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#333333]">Blog Posts</h2>
          <p className="text-sm text-[#888] mt-1">{items.length} total posts</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
        >
          <Plus size={16} /> New Post
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari berdasarkan judul atau tanggal..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all bg-white"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
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
          {search ? `Tidak ada hasil untuk "${search}"` : 'No blog posts yet. Click "New Post" to get started.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              {item.coverImage ? (
                <img src={item.coverImage} alt={item.title} className="w-16 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-14 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <Globe size={20} className="text-sky-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">{formatDate(item.createdAt)}</p>
                <p className="font-semibold text-[#333333] text-sm truncate">{item.title}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(item)} className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg transition-colors">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#333333] text-lg">
                {modal.editing ? 'Edit Post' : 'New Post'}
              </h3>
              <button onClick={() => setModal({ open: false, editing: null })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-[#444] mb-2">Cover Image</label>
                {form.coverImage && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden mb-2">
                    <img src={form.coverImage} alt="cover" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, coverImage: '' }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                {!form.coverImage && (
                  <button
                    type="button"
                    onClick={() => coverRef.current?.click()}
                    disabled={coverUploading}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 hover:border-sky-400 text-[#555] hover:text-sky-600 rounded-xl text-sm font-medium transition-all disabled:opacity-60 w-full justify-center"
                  >
                    <Upload size={15} />
                    {coverUploading ? 'Memproses...' : 'Upload Cover Image'}
                  </button>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[#444] mb-1.5">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Blog post title..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-[#444] mb-1.5">Link (opsional)</label>
                <input
                  type="url"
                  value={form.link || ''}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-[#444] mb-2">Content</label>
                <RichEditor
                  value={form.content}
                  onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setModal({ open: false, editing: null })}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-[#555] text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || coverUploading}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
              >
                <Save size={15} />
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
