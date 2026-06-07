import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BlogPost } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react';

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'blogs', id));
        if (snap.exists()) setPost({ id: snap.id, ...snap.data() } as BlogPost);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const formatDate = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 pt-24 pb-20 transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-6 space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 pt-24 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Post not found.</p>
          <button
            onClick={() => navigate('/blog')}
            className="text-sky-500 hover:underline font-medium"
          >
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 pt-24 pb-20 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-6">
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center gap-2 text-[#555] dark:text-gray-400 hover:text-sky-600 transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Blog</span>
        </button>

        {post.coverImage && (
          <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-4 mb-5 flex-wrap">
          {post.createdAt && (
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Calendar size={13} />
              {formatDate(post.createdAt)}
            </span>
          )}
          {post.link && (
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-sky-500 hover:text-sky-700 font-medium transition-colors"
            >
              <ExternalLink size={13} />
              Lihat Link
            </a>
          )}
        </div>

        <h1 className="text-4xl font-bold text-[#333333] dark:text-gray-100 leading-tight mb-8">{post.title}</h1>

        <div
          className="prose prose-lg max-w-none text-[#444] dark:text-gray-300 leading-relaxed
            prose-h1:text-[#333333] dark:prose-h1:text-gray-100 prose-h1:font-bold
            prose-h2:text-[#333333] dark:prose-h2:text-gray-100 prose-h2:font-bold
            prose-h3:text-[#333333] dark:prose-h3:text-gray-200 prose-h3:font-semibold
            prose-p:text-[#444] dark:prose-p:text-gray-300 prose-p:leading-relaxed
            prose-strong:text-[#333333] dark:prose-strong:text-gray-200
            prose-em:text-[#555] dark:prose-em:text-gray-400
            prose-img:rounded-xl prose-img:shadow-md
            prose-a:text-sky-500 hover:prose-a:text-sky-700"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </article>
  );
};

export default BlogDetail;
