import * as React from 'react';

import { GridSection } from '@/components/marketing/fragments/grid-section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const DATA = [
  {
    name: 'Paul Wegerer',
    role: 'Co-Founder, CEO',
    image: '/marketing/story/Paul.webp',
    previousRole: '',
    education: ''
  },
  {
    name: 'Liebhard Mattuschka',
    role: 'Co-Founder, COO',
    image: '/marketing/story/Liebhard.webp',
    previousRole: '',
    education: ''
  },
  {
    name: 'Keremhan Eke',
    role: 'Co-Founder, CTO',
    image: '/marketing/story/Keremhan.webp',
    previousRole: '',
    education: ''
  },
  {
    name: 'Timur Uzunoglu',
    role: 'Co-Founder, CFO',
    image: '/marketing/story/Timur.webp',
    previousRole: '',
    education: ''
  },
  {
    name: 'Asse Boerties',
    role: 'Business Strategist',
    image: '/marketing/story/Asse.webp',
    previousRole: '',
    education: ''
  },
  // {
  //   name: 'Sarp Doruk Aslan',
  //   role: 'Frontend Developer',
  //   image: '/marketing/story/Sarp.webp',
  //   previousRole: '',
  //   education: ''
  // },
  {
    name: 'Eren Karayigit',
    role: 'Software Developer',
    image: '/marketing/story/Eren.webp',
    previousRole: '',
    education: ''
  },
  {
    name: 'Oleg Moshkovich',
    role: 'Product Architect',
    image: '/marketing/story/Oleg.webp',
    previousRole: '',
    education: ''
  },
  {
    name: 'Izudin Sisic',
    role: 'BIM-Expert',
    image: '/marketing/story/Izudin.webp',
    previousRole: '',
    education: ''
  }
];

export function StoryTeam(): React.JSX.Element {
  return (
    <GridSection>
      <div className="container max-w-6xl py-20">
        <h2 className="mb-16 text-sm font-medium uppercase tracking-wider text-muted-foreground ">
          Das Team
        </h2>
        <div className="flex flex-wrap gap-24">
          {DATA.map((person, index) => (
            <div
              key={index}
              className="space-y-8"
            >
              <Avatar className="size-24 border-4 border-neutral-200 dark:border-neutral-800">
                <AvatarImage
                  src={person.image}
                  alt={person.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-xl">
                  {person.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{person.name}</h3>
                  <p className="text-primary">{person.role}</p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{person.previousRole}</p>
                  <p>{person.education}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GridSection>
  );
}
