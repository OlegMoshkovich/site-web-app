'use client';

import * as React from 'react';
import Link from 'next/link';

function LangSwitcher({
  language,
  setLanguage,
  variant = 'default',
}: {
  language: 'de' | 'en';
  setLanguage: (l: 'de' | 'en') => void;
  variant?: 'default' | 'dark';
}) {
  const active = variant === 'dark' ? 'text-foreground font-medium' : 'text-black font-medium';
  const inactive =
    variant === 'dark'
      ? 'text-muted-foreground hover:text-foreground'
      : 'text-gray-400 hover:text-gray-600';
  const sep = variant === 'dark' ? 'text-muted-foreground/60' : 'text-gray-300';
  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLanguage('de')}
        className={`${language === 'de' ? active : inactive} transition-colors`}
      >
        DE
      </button>
      <span className={sep}>/</span>
      <button
        onClick={() => setLanguage('en')}
        className={`${language === 'en' ? active : inactive} transition-colors`}
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

const stroke = (variant: 'default' | 'dark') => (variant === 'dark' ? 'currentColor' : 'black');

export function MarketingNavbar({ variant = 'default' }: { variant?: 'default' | 'dark' } = {}): React.JSX.Element {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [language, setLanguage] = React.useState<'de' | 'en'>('de');

  const c = navContent[language];
  const isDark = variant === 'dark';
  const navBar = isDark ? 'bg-background border-0' : 'bg-white border-b border-gray-200';
  const logo = isDark
    ? 'text-md font-bold text-white bg-black px-3 py-1 border border-gray-800'
    : 'text-md font-bold text-black px-3 py-1 border border-gray-300';
  const link = isDark
    ? 'text-sm text-muted-foreground hover:text-foreground transition-colors'
    : 'text-sm text-gray-500 hover:text-black transition-colors';
  const mobileOverlay = isDark ? 'bg-background' : 'bg-white';
  const mobileHeaderRow = isDark ? '' : 'border-b border-gray-200';
  const iconBtnClass = isDark ? 'text-foreground' : '';
  const s = stroke(variant);

  return (
    <nav className={`fixed top-0 z-50 w-full ${navBar}`}>
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center px-3 sm:px-8 h-16">
        <Link href="/" className={logo}>
          clone:it
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          <Link href="/software" className={link}>
            {c.software}
          </Link>
          <Link href="/blog" className={link}>
            {c.blog}
          </Link>
          <Link href="/auth/login" className={link}>
            {c.signIn}
          </Link>
          <LangSwitcher language={language} setLanguage={setLanguage} variant={variant} />
        </div>

        {/* Hamburger */}
        <button
          className={`sm:hidden flex items-center justify-center w-8 h-8 ${iconBtnClass}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <line x1="0" y1="1" x2="16" y2="1" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="0" y1="6" x2="16" y2="6" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="0" y1="11" x2="16" y2="11" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Full-screen mobile menu overlay */}
      {menuOpen && (
        <div className={`sm:hidden fixed inset-0 z-50 ${mobileOverlay} flex flex-col`}>
          <div className={`flex justify-between items-center px-3 h-16 ${mobileHeaderRow}`}>
            <Link href="/" onClick={() => setMenuOpen(false)} className={logo}>
              clone:it
            </Link>
            <button
              className={`flex items-center justify-center w-8 h-8 ${iconBtnClass}`}
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <line x1="1" y1="1" x2="15" y2="15" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="15" y1="1" x2="1" y2="15" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-6 px-3 pt-8">
            <Link href="/software" onClick={() => setMenuOpen(false)} className={link}>
              {c.software}
            </Link>
            <Link href="/blog" onClick={() => setMenuOpen(false)} className={link}>
              {c.blog}
            </Link>
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} className={link}>
              {c.signIn}
            </Link>
            <Link href="/auth/sign-up" onClick={() => setMenuOpen(false)} className={link}>
              {c.signUp}
            </Link>
            <LangSwitcher language={language} setLanguage={setLanguage} variant={variant} />
          </div>
        </div>
      )}
    </nav>
  );
}
