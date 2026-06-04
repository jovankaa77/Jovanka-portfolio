import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BlogPost } from '../types';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Search, X } from 'lucide-react';

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost)));
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDate = p.createdAt
        ? new Date(p.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }).toLowerCase().includes(q)
        : false;
      return matchTitle || matchDate;
    });
  }, [posts, search]);

  const getExcerpt = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || '';
    return text.slice(0, 160) + (text.length > 160 ? '…' : '');
  };

  const formatDate = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <section className="min-h-screen bg-[#F9FAFB] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <span className="inline-block text-sky-500 text-sm font-semibold tracking-widest uppercase mb-3">Writing</span>
          <h2 className="text-4xl font-bold text-[#333333] mb-4">Blog</h2>
          <div className="w-16 h-1 bg-sky-500 rounded mb-8" />

          {/* Search */}
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan judul atau tanggal..."
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm text-[#333] bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">
              {search ? `Tidak ada hasil untuk "${search}"` : 'No blog posts yet.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {filtered.map((post) => (
              <article
                key={post.id}
                onClick={() => navigate(`/blog/${post.id}`)}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                {post.coverImage && (
                  <div className="w-full h-48 overflow-hidden">
                    <img src={post.coverImage} alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  {post.createdAt && (
                    <span className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                      <Calendar size={10} />
                      {formatDate(post.createdAt)}
                    </span>
                  )}
                  <h3 className="font-bold text-[#333333] text-xl mb-2 group-hover:text-sky-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-[#666] text-sm leading-relaxed line-clamp-3 flex-1">
                    {getExcerpt(post.content)}
                  </p>
                  <div className="mt-4 text-sky-500 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read more <span>→</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Blog;
