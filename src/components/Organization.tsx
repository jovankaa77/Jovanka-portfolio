import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Organization } from '../types';
import { Briefcase, Search, X, CalendarRange } from 'lucide-react';

const OrganizationPage: React.FC = () => {
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, []);

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

  return (
    <section className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 pt-24 pb-20 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-10">
          <span className="inline-block text-sky-500 text-sm font-semibold tracking-widest uppercase mb-3">
            Experience
          </span>
          <h2 className="text-4xl font-bold text-[#333333] dark:text-gray-100 mb-4">Organization</h2>
          <div className="w-16 h-1 bg-sky-500 rounded mb-8" />

          {/* Search */}
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama organisasi, jabatan, atau tahun..."
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-[#333] dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
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
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">
              {search ? `Tidak ada hasil untuk "${search}"` : 'No organizations yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((org) => (
              <div
                key={org.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-start gap-5"
              >
                <div className="w-11 h-11 bg-sky-50 dark:bg-sky-900/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Briefcase size={20} className="text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#333333] dark:text-gray-100 text-base mb-0.5">
                    {org.name}
                  </h3>
                  <p className="text-sky-600 dark:text-sky-400 text-sm font-semibold mb-2">
                    {org.position}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                    <CalendarRange size={12} />
                    {org.from} — {org.until}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default OrganizationPage;
