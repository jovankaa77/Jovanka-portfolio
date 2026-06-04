import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc,
  doc, orderBy, query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project, PROJECT_CATEGORIES, ProjectCategory } from '../types';
import {
  Plus, Pencil, Trash2, X, Save, Upload, Image as ImageIcon,
  ChevronLeft, ChevronRight, Search, Bold, Italic,
  Heading1, Heading2, List, Hash,
} from 'lucide-react';

const EMPTY: Omit<Project, 'id' | 'createdAt'> = {
  name: '',
  description: '',
  technologies: '',
  images: [],
  categories: [],
  priority: undefined,
  story: '',
  link: '',
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Compress image to stay well under Firestore 1MB doc limit.
// maxDim caps width/height, quality sets JPEG compression.
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

// Story images can be wider but we keep quality moderate so many can fit
const compressStoryImage = (file: File) => compressImage(file, 1000, 0.68);

/* ── Rich Text Editor (Story) ── */
const StoryEditor: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
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
      const base64 = await compressStoryImage(file);
      exec('insertHTML', `<img src="${base64}" alt="" style="max-width:100%;border-radius:12px;margin:8px 0;" />`);
    } catch {
      alert('Gagal membaca gambar.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const tools = [
    { icon: <Bold size={14} />, cmd: 'bold', title: 'Bold' },
    { icon: <Italic size={14} />, cmd: 'italic', title: 'Italic' },
    { icon: <Heading1 size={14} />, cmd: 'formatBlock', val: 'H2', title: 'Heading' },
    { icon: <Heading2 size={14} />, cmd: 'formatBlock', val: 'H3', title: 'Subheading' },
    { icon: <List size={14} />, cmd: 'insertUnorderedList', title: 'List' },
  ];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-sky-400">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {tools.map((t) => (
          <button key={t.title} type="button" title={t.title}
            onMouseDown={(e) => { e.preventDefault(); exec(t.cmd, t.val); }}
            className="p-1.5 rounded-lg text-[#555] hover:bg-gray-200 hover:text-sky-600 transition-colors"
          >
            {t.icon}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageInsert} />
        <button type="button" title="Insert Image"
          onMouseDown={(e) => { e.preventDefault(); fileRef.current?.click(); }}
          disabled={uploading}
          className="p-1.5 rounded-lg text-[#555] hover:bg-gray-200 hover:text-sky-600 transition-colors disabled:opacity-50 flex items-center gap-1 text-xs"
        >
          <ImageIcon size={14} />
          {uploading ? ' ...' : ''}
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
        className="min-h-[160px] p-4 text-[#333333] text-sm leading-relaxed focus:outline-none
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:text-[#222]
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:text-[#333]
          [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-2
          [&_em]:italic [&_strong]:font-bold
          [&_img]:max-w-full [&_img]:rounded-xl"
      />
    </div>
  );
};

/* ── Main Component ── */
const AdminProjects: React.FC = () => {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; editing: Project | null }>({ open: false, editing: null });
  const [form, setForm] = useState<Omit<Project, 'id' | 'createdAt'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'story'>('info');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
      // sort by priority if set
      data.sort((a, b) => {
        const pa = a.priority ?? 999999;
        const pb = b.priority ?? 999999;
        if (pa !== pb) return pa - pb;
        return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      });
      setItems(data);
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
    return items.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      item.technologies.toLowerCase().includes(q)
    );
  }, [items, search]);

  const openCreate = () => {
    setForm(EMPTY);
    setPreviewIdx(0);
    setActiveTab('info');
    setModal({ open: true, editing: null });
  };

  const openEdit = (item: Project) => {
    setForm({
      name: item.name,
      description: item.description,
      technologies: item.technologies,
      images: item.images || [],
      categories: item.categories || [],
      priority: item.priority,
      story: item.story || '',
      link: item.link || '',
    });
    setPreviewIdx(0);
    setActiveTab('info');
    setModal({ open: true, editing: item });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const base64List = await Promise.all(Array.from(files).map((f) => compressImage(f)));
      setForm((prev) => ({ ...prev, images: [...prev.images, ...base64List] }));
    } catch {
      alert('Gagal membaca gambar. Coba lagi.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
    setPreviewIdx((p) => (p >= idx && p > 0 ? p - 1 : p));
  };

  const toggleCategory = (cat: ProjectCategory) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Project name is required.');
    setSaving(true);
    try {
      const payload = {
        ...form,
        priority: form.priority !== undefined && form.priority !== null && String(form.priority) !== '' ? Number(form.priority) : null,
      };
      if (modal.editing?.id) {
        await updateDoc(doc(db, 'projects', modal.editing.id), payload);
      } else {
        await addDoc(collection(db, 'projects'), { ...payload, createdAt: Date.now() });
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
    if (!confirm('Delete this project?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'projects', id));
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      alert('Failed to delete: ' + (e?.message || e));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#333333]">Projects</h2>
          <p className="text-sm text-[#888] mt-1">{items.length} total projects</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
        >
          <Plus size={16} /> Add Project
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari berdasarkan judul atau bahasa pemrograman..."
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
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          {search ? `Tidak ada hasil untuk "${search}"` : 'No projects yet. Click "Add Project" to get started.'}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              {item.images && item.images[0] ? (
                <img src={item.images[0]} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <ImageIcon size={22} className="text-sky-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-[#333333] text-sm truncate">{item.name}</p>
                  {item.priority != null && (
                    <span className="flex-shrink-0 flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                      <Hash size={10} /> {item.priority}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{item.technologies}</p>
                {(item.categories || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(item.categories || []).slice(0, 2).map((c) => (
                      <span key={c} className="text-[10px] bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded-full">{c}</span>
                    ))}
                    {(item.categories || []).length > 2 && (
                      <span className="text-[10px] text-gray-400">+{(item.categories || []).length - 2}</span>
                    )}
                  </div>
                )}
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
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#333333] text-lg">
                {modal.editing ? 'Edit Project' : 'Add Project'}
              </h3>
              <button onClick={() => setModal({ open: false, editing: null })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
              {(['info', 'story'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
                    activeTab === tab ? 'bg-white text-sky-600 shadow-sm' : 'text-[#666] hover:text-[#333]'
                  }`}
                >
                  {tab === 'info' ? 'Info Proyek' : 'Story / Blog'}
                </button>
              ))}
            </div>

            {activeTab === 'info' && (
              <div className="space-y-4">
                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-[#444] mb-2">Images</label>
                  {form.images.length > 0 && (
                    <div className="mb-3">
                      <div className="relative w-full h-40 bg-gray-100 rounded-xl overflow-hidden mb-2">
                        <img src={form.images[previewIdx]} alt="preview" className="w-full h-full object-cover" />
                        {form.images.length > 1 && (
                          <>
                            <button type="button"
                              onClick={() => setPreviewIdx((c) => (c === 0 ? form.images.length - 1 : c - 1))}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1">
                              <ChevronLeft size={14} />
                            </button>
                            <button type="button"
                              onClick={() => setPreviewIdx((c) => (c === form.images.length - 1 ? 0 : c + 1))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1">
                              <ChevronRight size={14} />
                            </button>
                          </>
                        )}
                        <button type="button" onClick={() => removeImage(previewIdx)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <X size={12} />
                        </button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {form.images.map((img, i) => (
                          <button type="button" key={i} onClick={() => setPreviewIdx(i)}
                            className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === previewIdx ? 'border-sky-500' : 'border-gray-200'}`}>
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 hover:border-sky-400 text-[#555] hover:text-sky-600 rounded-xl text-sm font-medium transition-all disabled:opacity-60 w-full justify-center">
                    <Upload size={15} />
                    {uploading ? 'Memproses gambar...' : 'Upload Images'}
                  </button>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[#444] mb-1.5">Project Name *</label>
                  <input type="text" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="My Awesome Project"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#444] mb-1.5">Description</label>
                  <textarea value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="Describe your project..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all resize-none" />
                </div>

                {/* Technologies */}
                <div>
                  <label className="block text-sm font-medium text-[#444] mb-1.5">
                    Technologies <span className="text-gray-400 font-normal">(comma-separated)</span>
                  </label>
                  <input type="text" value={form.technologies}
                    onChange={(e) => setForm((f) => ({ ...f, technologies: e.target.value }))}
                    placeholder="Laravel, React, Python, MySQL..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all" />
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-[#444] mb-2">
                    Kategori <span className="text-gray-400 font-normal">(bisa lebih dari satu)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                          form.categories.includes(cat)
                            ? 'bg-sky-500 text-white border-sky-500'
                            : 'bg-white text-[#555] border-gray-200 hover:border-sky-400 hover:text-sky-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-[#444] mb-1.5">
                    Prioritas{' '}
                    <span className="text-gray-400 font-normal">(angka kecil = tampil lebih dulu, kosongkan untuk default)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.priority ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    placeholder="1, 2, 3 ..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
                  />
                </div>

                {/* Link */}
                <div>
                  <label className="block text-sm font-medium text-[#444] mb-1.5">
                    Link Project{' '}
                    <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <input
                    type="url"
                    value={form.link || ''}
                    onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                    placeholder="https://github.com/username/project"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#333333] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
                  />
                </div>
              </div>
            )}

            {activeTab === 'story' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">
                  Tuliskan cerita / detail proyek ini. Akan muncul sebagai popup saat card di-klik di halaman publik.
                </p>
                <StoryEditor
                  value={form.story || ''}
                  onChange={(v) => setForm((f) => ({ ...f, story: v }))}
                />
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setModal({ open: false, editing: null })}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-[#555] text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving || uploading}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
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

export default AdminProjects;
