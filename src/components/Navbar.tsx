import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const navItems = [
  { label: 'About', href: '/' },
  { label: 'Achievement', href: '/achievement' },
  { label: 'Project', href: '/project' },
  { label: 'Organization', href: '/organization' },
  { label: 'Blog', href: '/blog' },
];

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800/50'
          : 'bg-[#F9FAFB] dark:bg-gray-900'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-[#333333] dark:text-gray-100 tracking-tight hover:text-sky-600 transition-colors">
          Jovanka<span className="text-sky-500">.</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-7">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`text-sm font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-sky-500 after:transition-all hover:after:w-full hover:text-sky-600 dark:hover:text-sky-400 ${
                location.pathname === item.href
                  ? 'text-sky-600 dark:text-sky-400 after:w-full'
                  : 'text-[#555] dark:text-gray-400'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Dark toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-xl text-[#555] dark:text-gray-400 hover:bg-sky-50 dark:hover:bg-gray-800 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Mobile: dark toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-[#555] dark:text-gray-400 hover:bg-sky-50 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-[#333333] dark:text-gray-200 hover:bg-sky-50 dark:hover:bg-gray-800 transition-colors"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex flex-col gap-4 shadow-lg">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`text-sm font-medium py-2 transition-colors ${
                location.pathname === item.href
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-[#333333] dark:text-gray-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
