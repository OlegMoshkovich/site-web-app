import * as React from 'react';
import { cn } from '@/lib/utils';

interface SiteHeadingProps {
  title: React.ReactNode;
  badge?: string;
  subtitle?: string;
  description?: React.ReactNode;
  className?: string;
}

export function SiteHeading({ title, badge, subtitle, description, className }: SiteHeadingProps): React.JSX.Element {
  return (
    <div className={cn('flex flex-col items-center gap-2 text-center', className)}>
      {badge && <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{badge}</span>}
      <h2 className="text-3xl font-semibold md:text-4xl">{title}</h2>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      {description && <p className="max-w-2xl text-muted-foreground">{description}</p>}
    </div>
  );
}
