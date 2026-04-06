'use client';

import * as React from 'react';
import Link from 'next/link';

function LangSwitcher({ language, setLanguage }: { language: 'de' | 'en'; setLanguage: (l: 'de' | 'en') => void }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLanguage('de')}
        className={`${language === 'de' ? 'text-black font-medium' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
      >
        DE
      </button>
      <span className="text-gray-300">/</span>
      <button
        onClick={() => setLanguage('en')}
        className={`${language === 'en' ? 'text-black font-medium' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
      >
        EN
      </button>
    </div>
  );
}

const navContent = {
  en: { software: 'Our Software', blog: 'Blog', signIn: 'Sign in', signUp: 'Sign up' },
  de: { software: 'Software', blog: 'Blog', signIn: 'Anmelden', signUp: 'Registrieren' },
};

export function MarketingNavbar(): React.JSX.Element {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [language, setLanguage] = React.useState<'de' | 'en'>('de');

  const c = navContent[language];

  return (
    <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center px-3 sm:px-8 h-16">
        <Link href="/" className="text-md font-bold text-black px-3 py-1 border border-gray-300">
          clone:it
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          <Link href="/software" className="text-sm text-gray-500 hover:text-black transition-colors">
            {c.software}
          </Link>
          <Link href="/blog" className="text-sm text-gray-500 hover:text-black transition-colors">
            {c.blog}
          </Link>
          <Link href="/auth/login" className="text-sm text-gray-500 hover:text-black transition-colors">
            {c.signIn}
          </Link>
          <LangSwitcher language={language} setLanguage={setLanguage} />
        </div>

        {/* Hamburger */}
        <button
          className="sm:hidden flex items-center justify-center w-8 h-8"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <line x1="0" y1="1" x2="16" y2="1" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="0" y1="6" x2="16" y2="6" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="0" y1="11" x2="16" y2="11" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Full-screen mobile menu overlay */}
      {menuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex justify-between items-center px-3 h-16 border-b border-gray-200">
            <Link href="/" onClick={() => setMenuOpen(false)} className="text-md font-bold text-black px-3 py-1 border border-gray-300">
              clone:it
            </Link>
            <button
              className="flex items-center justify-center w-8 h-8"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <line x1="1" y1="1" x2="15" y2="15" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="15" y1="1" x2="1" y2="15" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-6 px-3 pt-8">
            <Link href="/software" onClick={() => setMenuOpen(false)} className="text-sm text-gray-500 hover:text-black transition-colors">
              {c.software}
            </Link>
            <Link href="/blog" onClick={() => setMenuOpen(false)} className="text-sm text-gray-500 hover:text-black transition-colors">
              {c.blog}
            </Link>
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-sm text-gray-500 hover:text-black transition-colors">
              {c.signIn}
            </Link>
            <Link href="/auth/sign-up" onClick={() => setMenuOpen(false)} className="text-sm text-gray-500 hover:text-black transition-colors">
              {c.signUp}
            </Link>
            <LangSwitcher language={language} setLanguage={setLanguage} />
          </div>
        </div>
      )}
    </nav>
  );
}
