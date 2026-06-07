import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Achievement as AchievementItem, AchievementType } from '../types';
import { Trophy, Star, Award, Users, BadgeCheck, ExternalLink } from 'lucide-react';

const TYPE_CONFIG: Record<AchievementType, { color: string; darkColor: string; bg: string; icon: React.ReactNode }> = {
  'Juara 1': {
    color: 'text-amber-700',
    darkColor: 'dark:text-amber-400',
    bg: 'bg-amber-50 border-amber-200',
    icon: <Trophy size={20} className="text-amber-500" />,
  },
  'Juara 2': {
    color: 'text-slate-600',
    darkColor: 'dark:text-slate-300',
    bg: 'bg-slate-50 border-slate-200',
    icon: <Trophy size={20} className="text-slate-400" />,
  },
  'Juara 3': {
    color: 'text-orange-700',
    darkColor: 'dark:text-orange-400',
    bg: 'bg-orange-50 border-orange-200',
    icon: <Trophy size={20} className="text-orange-400" />,
  },
  'Favorite 1': {
    color: 'text-pink-700',
    darkColor: 'dark:text-pink-400',
    bg: 'bg-pink-50 border-pink-200',
    icon: <Star size={20} className="text-pink-500" />,
  },
  'Favorite 2': {
    color: 'text-pink-600',
    darkColor: 'dark:text-pink-400',
    bg: 'bg-pink-50 border-pink-100',
    icon: <Star size={20} className="text-pink-400" />,
  },
  'Favorite 3': {
    color: 'text-pink-500',
    darkColor: 'dark:text-pink-300',
    bg: 'bg-pink-50 border-pink-100',
    icon: <Star size={20} className="text-pink-300" />,
  },
  Awardee: {
    color: 'text-sky-700',
    darkColor: 'dark:text-sky-400',
    bg: 'bg-sky-50 border-sky-200',
    icon: <Award size={20} className="text-sky-500" />,
  },
  Participant: {
    color: 'text-emerald-700',
    darkColor: 'dark:text-emerald-400',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: <Users size={20} className="text-emerald-500" />,
  },
  'Sertifikat Kompetensi': {
    color: 'text-teal-700',
    darkColor: 'dark:text-teal-400',
    bg: 'bg-teal-50 border-teal-200',
    icon: <BadgeCheck size={20} className="text-teal-500" />,
  },
};

const AchievementPage: React.FC = () => {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, 'achievements'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setAchievements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AchievementItem)));
      } catch {
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const grouped = achievements.reduce<Record<string, AchievementItem[]>>((acc, a) => {
    acc[a.type] = acc[a.type] || [];
    acc[a.type].push(a);
    return acc;
  }, {});

  return (
    <section className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 pt-24 pb-20 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <span className="inline-block text-sky-500 text-sm font-semibold tracking-widest uppercase mb-3">
            Recognition
          </span>
          <h2 className="text-4xl font-bold text-[#333333] dark:text-gray-100 mb-4">Achievements</h2>
          <div className="w-16 h-1 bg-sky-500 rounded" />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Trophy size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">No achievements yet. Add some from the admin panel.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {(Object.keys(TYPE_CONFIG) as AchievementType[]).map((type) => {
              const items = grouped[type];
              if (!items || items.length === 0) return null;
              const cfg = TYPE_CONFIG[type];
              return (
                <div key={type}>
                  <div className="flex items-center gap-3 mb-5">
                    {cfg.icon}
                    <h3 className={`text-lg font-bold ${cfg.color} ${cfg.darkColor}`}>{type}</h3>
                    <span className="text-sm text-gray-400 font-medium">
                      ({items.length} {items.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((a) => (
                      <div
                        key={a.id}
                        className={`border rounded-2xl p-5 ${cfg.bg} dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex flex-col`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-0.5 flex-shrink-0">{cfg.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm mb-1 ${cfg.color} ${cfg.darkColor}`}>{a.type}</p>
                            <p className="text-[#333333] dark:text-gray-200 font-medium text-sm leading-snug">
                              {a.competitionName}
                            </p>
                            {(a.year || a.organizer) && (
                              <p className="text-[#888] text-xs mt-2">
                                {[a.year, a.organizer].filter(Boolean).join(' • ')}
                              </p>
                            )}
                          </div>
                        </div>
                        {a.link && (
                          <div className="mt-4 pt-3 border-t border-black/5">
                            <a
                              href={a.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 ${cfg.color} bg-white/70 hover:bg-white border border-current/20`}
                            >
                              <ExternalLink size={11} />
                              View Certificate Details
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default AchievementPage;
