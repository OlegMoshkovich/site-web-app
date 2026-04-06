import * as React from 'react';

import { CTA } from '@/components/sections/cta';
import { FAQ } from '@/components/sections/faq';
import { Hero } from '@/components/sections/hero';
import { Logos } from '@/components/sections/logos';
import { Problem } from '@/components/sections/problem';
import { SolutionOverview } from '@/components/sections/solutionOverview';
import { Stats } from '@/components/sections/stats';

// import { Solution } from '@/components/sections/solution';
// import { Testimonials } from '@/components/sections/testimonials';

export default function ArPage(): React.JSX.Element {
  return (
    <>
      <Hero />
      <Logos />
      {/* <Testimonials /> */}
      <FAQ />
    </>
  );
}
