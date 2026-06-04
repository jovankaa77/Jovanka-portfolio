import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AboutData } from '../types';

const DEFAULT_ABOUT: AboutData = {
  heading: 'Hi, Jovanka here!',
  paragraph: `I am Jovanka Alexandro, a bachelor of Software Engineering student.\n\nMy passion for software lies with dreaming up ideas and making them come true with elegant interfaces. I take great care in experience, architecture, and code quality of the things I build.\n\nI am also an open-source enthusiast and maintainer. You can see list of my projects here. I love how collaboration and knowledge sharing happens through open-source, and I am happy to see what I do could eventually feedback to the community and industry.\n\nOutside of programming, I enjoy reading books. I love the pleasure and excitement of gaining new knowledge other than programming from the books I read.`,
};

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
    <section className="min-h-screen bg-[#F9FAFB] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
          </div>
        ) : (
          <>
            <span className="inline-block text-sky-500 text-sm font-semibold tracking-widest uppercase mb-4">
              Portfolio
            </span>
            <h1 className="text-5xl font-bold text-[#333333] leading-tight mb-6">
              {about.heading}
            </h1>
            <div className="w-16 h-1 bg-sky-500 rounded mb-8" />
            <div className="space-y-4 max-w-2xl">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-[#555] leading-relaxed text-base">
                  {p}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default About;
