import React from 'react';
import Link from 'next/link';

export interface FooterProps {
  /** @deprecated Logged-in home uses `HomeAppFooter` instead */
  user?: { id: string; email?: string } | null;
  /** Guest / marketing pages — tint for links on dark hero backgrounds */
  textColor?: string;
}

export function Footer({ textColor }: FooterProps) {
  const guestClasses = textColor ?? 'text-white';

  return (
    <footer className="w-full pt-8 pb-0 mt-12 sm:mt-12 mb-8">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-8">
        <div className={`text-xs ${guestClasses} flex gap-4`}>
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
