import * as React from 'react';
import { cn } from '@/lib/utils';

interface GridSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function GridSection({ children, className }: GridSectionProps): React.JSX.Element {
  return (
    <section
      className={cn(
        'relative mx-auto w-full max-w-6xl',
        className
      )}
    >
      {children}
    </section>
  );
}
