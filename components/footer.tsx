import React from 'react';
import Link from 'next/link';

export interface FooterProps {
  user?: { id: string; email?: string } | null;
}

export interface FooterProps {
  user?: { id: string; email?: string } | null;
  textColor?: string;
}

export function Footer({ user, textColor }: FooterProps) {
  // Use `textColor` prop if provided, otherwise fall back to default logic
  const resolvedTextColor = textColor ?? (user ? 'text-black' : 'text-white');
  if (user) {
    return (
      <footer className="fixed bottom-0 left-0 w-full bg-white z-40 pb-2 pt-4 sm:pb-4">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-8">
          <div className={`text-xs ${resolvedTextColor} flex flex-col gap-y-0.5 pb-1`}>
            <span className="font-medium">clone:it GmbH</span>
            <a href="mailto:admin@cloneit.site" className="hover:underline font-medium">admin@cloneit.site</a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full pt-8 pb-0 mt-12 sm:mt-12 mb-8">
      <div className="mx-[10px] md:mx-0">
        <div className={`text-xs ${textColor} flex gap-4`}>
          <Link href="/impressum" className="underline underline-offset-4 hover:text-white transition-colors">
            Impressum
          </Link>
          <Link href="/privacy-policy" className="underline underline-offset-4 hover:text-white transition-colors">
            Datenschutz
          </Link>
        </div>
      </div>
    </footer>
  );
}