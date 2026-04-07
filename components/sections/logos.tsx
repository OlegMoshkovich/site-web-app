import * as React from 'react';
import Image from 'next/image';

import { BlurFade } from '@/components/marketing/fragments/blur-fade';
import { GridSection } from '@/components/marketing/fragments/grid-section';

const DATA = [
  { src: '/marketing/logos/convex-logo.jpg', alt: 'Bernard Logo' },
  { src: '/marketing/logos/reif.png', alt: 'Reif Logo' },
  { src: '/marketing/logos/HOCHTIEF-Logo.jpg', alt: 'Hochtief Logo' },
  { src: '/marketing/logos/db.png', alt: 'DB Logo' }
];

export function Logos(): React.JSX.Element {
  return (
    <GridSection className="bg-diagonal-lines">
      <div className="flex flex-col items-center justify-between gap-2 bg-background p-8 sm:flex-row sm:py-4">
        <BlurFade className="mb-6 sm:mb-0">
          <p className="max-w-[220px] text-center text-sm text-muted-foreground sm:text-left">
            Partnerunternehmen die clone:it bereits eingesetzt haben.
          </p>
        </BlurFade>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:max-w-4xl lg:gap-10">
          {DATA.map(({ src, alt }, index) => (
            <BlurFade
              key={index}
              delay={0.2 + index * 0.2}
              className="flex items-center justify-center text-neutral-700 dark:text-neutral-300"
            >
              <Image
                quality={100}
                src={src}
                width="100"
                height="50"
                alt={alt}
                className="block rounded-xl border shadow"
              />
            </BlurFade>
          ))}
        </div>
      </div>
    </GridSection>
  );
}
