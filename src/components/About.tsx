import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AboutData } from '../types';
import { Users, BookOpen } from 'lucide-react';

const DEFAULT_ABOUT: AboutData = {
  heading: 'Hi, Jovanka here!',
  paragraph: `I am Jovanka Alexandro, a bachelor of Software Engineering student.\n\nMy passion for software lies with dreaming up ideas and making them come true with elegant interfaces. I take great care in experience, architecture, and code quality of the things I build.\n\nI am also an open-source enthusiast and maintainer. You can see list of my projects here.`,
};

const INFO_BOXES = [
  {
    icon: <Users size={20} className="text-sky-500" />,
    heading: 'Collaboration and Knowledge Sharing',
    paragraph:
      'I am happy to see what I do could eventually feedback to the community and industry.',
  },
  {
    icon: <BookOpen size={20} className="text-sky-500" />,
    heading: 'Outside of Programming',
    paragraph:
      'I love the pleasure and excitement of gaining new knowledge.',
  },
];

const About: React.FC = () => {
  const [about, setAbout] = useState<AboutData>(DEFAULT_ABOUT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'about'));
        if (snap.exists()) {
          setAbout(snap.data() as AboutData);
        }
      } catch {
        // use default if firebase not configured
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  const paragraphs = about.paragraph.split('\n\n').filter(Boolean);

  return (
    <section className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 pt-24 pb-20 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
          </div>
        ) : (
          <>
            <span className="inline-block text-sky-500 text-sm font-semibold tracking-widest uppercase mb-4">
              Portfolio
            </span>
            <h1 className="text-5xl font-bold text-[#333333] dark:text-gray-100 leading-tight mb-6">
              {about.heading}
            </h1>
            <div className="w-16 h-1 bg-sky-500 rounded mb-8" />
            <div className="space-y-4 max-w-2xl mb-10">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-[#555] dark:text-gray-300 leading-relaxed text-base">
                  {p}
                </p>
              ))}
            </div>

            {/* Info Boxes */}
            <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
              {INFO_BOXES.map((box) => (
                <div
                  key={box.heading}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-sky-50 dark:bg-sky-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      {box.icon}
                    </div>
                    <h3 className="font-bold text-[#333333] dark:text-gray-100 text-sm leading-snug">
                      {box.heading}
                    </h3>
                  </div>
                  <p className="text-[#666] dark:text-gray-400 text-sm leading-relaxed">
                    {box.paragraph}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default About;
