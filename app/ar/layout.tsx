import * as React from 'react';
import { MarketingNavbar } from '@/components/marketing/marketing-navbar';
import { Footer } from '@/components/footer';

export default function ArLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <MarketingNavbar variant="dark" />
      <main className="pt-16">{children}</main>
      <Footer textColor="text-gray-500" />
    </div>
  );
}
