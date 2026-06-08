import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project, PROJECT_CATEGORIES, ProjectCategory } from '../types';
import { ChevronLeft, ChevronRight, X, ExternalLink, Search, BookOpen } from 'lucide-react';

const TECH_COLORS = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700',
  'bg-lime-100 text-lime-700',
];
const getTechColor = (i: number) => TECH_COLORS[i % TECH_COLORS.length];

/* ── Card Image Carousel (no click-through to modal) ── */
const CardCarousel: React.FC<{ images: string[] }> = ({ images }) => {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full h-56 bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center rounded-t-2xl">
        <span className="text-sky-400 text-sm font-medium">No Image</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-56 overflow-hidden rounded-t-2xl group bg-gray-100">
      <img
        src={images[current]}
        alt={`slide-${current}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c === 0 ? images.length - 1 : c - 1)); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c === images.length - 1 ? 0 : c + 1)); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/60 w-1.5'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Split-panel Project Modal ── */
const ProjectModal: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const images = project.images || [];
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => setImgIdx((i) => (i === 0 ? images.length - 1 : i - 1)), [images.length]);
  const next = useCallback(() => setImgIdx((i) => (i === images.length - 1 ? 0 : i + 1)), [images.length]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose, prev, next]);

  // Swipe support for the image panel
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) { delta < 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  const techs = project.technologies.split(',').map((t) => t.trim()).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      {/* Modal container */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left: Image gallery ── */}
        <div className="md:w-[45%] flex-shrink-0 bg-gray-950 flex flex-col">
          {images.length === 0 ? (
            <div className="flex-1 flex items-center justify-center min-h-[260px]">
              <span className="text-gray-500 text-sm">No images</span>
            </div>
          ) : (
            <>
              {/* Main image */}
              <div
                className="relative flex-1 min-h-[260px] md:min-h-0 overflow-hidden select-none flex items-center justify-center"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <img
                  key={imgIdx}
                  src={images[imgIdx]}
                  alt={project.name}
                  className="w-full h-full object-contain"
                  style={{ minHeight: 260 }}
                />
                {/* Counter badge */}
                {images.length > 1 && (
                  <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {imgIdx + 1} / {images.length}
                  </span>
                )}
                {/* Prev / Next overlays */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-gray-900/80 flex-shrink-0">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        i === imgIdx ? 'border-sky-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right: Story / info ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
            <div className="pr-4">
              {(project.categories || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(project.categories || []).map((c) => (
                    <span key={c} className="text-[11px] font-semibold bg-sky-100 text-sky-700 px-2.5 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              )}
              <h2 className="text-xl font-bold text-[#222] leading-tight">{project.name}</h2>
              {project.description && (
                <p className="text-sm text-[#666] dark:text-gray-300 leading-relaxed mt-2">{project.description}</p>
              )}
              {techs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {techs.map((tech, i) => (
                    <span key={i} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getTechColor(i)}`}>{tech}</span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable story body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {project.story && project.story.trim() ? (
              <div
                className="text-[#444] dark:text-gray-300 leading-relaxed text-sm
                  [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-[#1a1a1a] dark:[&_h2]:text-gray-100
                  [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[#333] dark:[&_h3]:text-gray-200
                  [&_p]:mb-3 [&_p]:leading-relaxed
                  [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3 [&_ul_li]:mb-1
                  [&_em]:italic [&_strong]:font-bold [&_strong]:text-[#333] dark:[&_strong]:text-gray-200
                  [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-md [&_img]:my-4 [&_img]:block"
                dangerouslySetInnerHTML={{ __html: project.story }}
              />
            ) : (
              <p className="text-[#666] dark:text-gray-300 leading-relaxed text-sm">{project.description}</p>
            )}
          </div>

          {/* Footer: Detail more button */}
          {project.link && (
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                <ExternalLink size={14} />
                Detail more
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ── */
const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | 'ALL'>('ALL');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
        data.sort((a, b) => {
          const pa = a.priority ?? 999999;
          const pb = b.priority ?? 999999;
          if (pa !== pb) return pa - pb;
          return (b.createdAt ?? 0) - (a.createdAt ?? 0);
        });
        setProjects(data);
      } catch {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    let result = projects;
    if (activeCategory !== 'ALL') {
      result = result.filter((p) => (p.categories || []).includes(activeCategory));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.technologies.toLowerCase().includes(q)
      );
    }
    return result;
  }, [projects, activeCategory, search]);

  return (
    <section className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 pt-24 pb-20 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <span className="inline-block text-sky-500 text-sm font-semibold tracking-widest uppercase mb-3">Work</span>
          <h2 className="text-4xl font-bold text-[#333333] dark:text-gray-100 mb-4">Projects</h2>
          <div className="w-16 h-1 bg-sky-500 rounded mb-8" />

          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama project atau teknologi..."
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-[#333] dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeCategory === 'ALL'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-white text-[#555] border border-gray-200 hover:border-sky-300 hover:text-sky-600'
              }`}
            >
              All
            </button>
            {PROJECT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'bg-white text-[#555] border border-gray-200 hover:border-sky-300 hover:text-sky-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <ExternalLink size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">
              {search || activeCategory !== 'ALL' ? 'Tidak ada project yang sesuai.' : 'No projects yet.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((project) => {
              const techs = project.technologies.split(',').map((t) => t.trim()).filter(Boolean);
              const hasStory = project.story && project.story.trim().length > 0;
              return (
                <div
                  key={project.id}
                  onClick={() => setActiveProject(project)}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col cursor-pointer group"
                >
                  <CardCarousel images={project.images || []} />
                  <div className="p-5 flex flex-col flex-1">
                    {(project.categories || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(project.categories || []).slice(0, 2).map((c) => (
                          <span key={c} className="text-[10px] font-semibold bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                        {(project.categories || []).length > 2 && (
                          <span className="text-[10px] text-gray-400 py-0.5">+{(project.categories || []).length - 2}</span>
                        )}
                      </div>
                    )}
                    <h3 className="font-bold text-[#333333] dark:text-gray-100 text-lg mb-2 line-clamp-1 group-hover:text-sky-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-[#666] dark:text-gray-300 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      {techs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {techs.slice(0, 3).map((tech, i) => (
                            <span key={i} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getTechColor(i)}`}>{tech}</span>
                          ))}
                          {techs.length > 3 && <span className="text-xs text-gray-400 py-0.5">+{techs.length - 3}</span>}
                        </div>
                      )}
                      {hasStory && (
                        <span className="flex items-center gap-1 text-xs text-sky-500 font-semibold ml-auto flex-shrink-0">
                          <BookOpen size={12} /> Story
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeProject && (
        <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />
      )}
    </section>
  );
};

export default Projects;
