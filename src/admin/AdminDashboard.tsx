import React from 'react';
import { Link } from 'react-router-dom';
import { User, Trophy, FolderGit2, BookOpen } from 'lucide-react';

const cards = [
  { label: 'About', desc: 'Edit your personal introduction', icon: <User size={28} />, href: '/admin/about', color: 'bg-sky-500' },
  { label: 'Achievement', desc: 'Manage your awards & competitions', icon: <Trophy size={28} />, href: '/admin/achievement', color: 'bg-amber-500' },
  { label: 'Projects', desc: 'Showcase your work & tech stack', icon: <FolderGit2 size={28} />, href: '/admin/projects', color: 'bg-emerald-500' },
  { label: 'Blog', desc: 'Write and publish articles', icon: <BookOpen size={28} />, href: '/admin/blog', color: 'bg-rose-500' },
];

const AdminDashboard: React.FC = () => (
  <div>
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-[#333333]">Welcome back, Admin!</h2>
      <p className="text-[#888] mt-1">Manage your portfolio content from here.</p>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((c) => (
        <Link
          key={c.href}
          to={c.href}
          className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
        >
          <div className={`${c.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-5 shadow-md group-hover:scale-110 transition-transform`}>
            {c.icon}
          </div>
          <h3 className="font-bold text-[#333333] mb-1">{c.label}</h3>
          <p className="text-sm text-[#888]">{c.desc}</p>
        </Link>
      ))}
    </div>
  </div>
);

export default AdminDashboard;
