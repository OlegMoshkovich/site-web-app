'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

import { GridSection } from '@/components/marketing/fragments/grid-section';
import { Marquee } from '@/components/marketing/fragments/marquee';
// import { AppInfo } from '@/constants/app-info';
import { cn } from '@/lib/utils';

const DATA = [
  {
    name: 'Jonas Braun',
    role: 'Construction Project Director at BauTech Solutions',
    img: 'https://randomuser.me/api/portraits/men/31.jpg',
    description: (
      <p>
        Clone it has completely transformed how we integrate BIM models on our
        construction sites.{' '}
        <strong>
          By automating repetitive tasks and unifying data handling, we’ve
          shortened project timelines by nearly 30%.
        </strong>{' '}
        The end-to-end workflow efficiency is remarkable.
      </p>
    )
  },
  {
    name: 'Maria Fischer',
    role: 'Construction Solutions Manager at DACH Build',
    img: 'https://randomuser.me/api/portraits/women/15.jpg',
    description: (
      <p>
        With Clone it, integrating BIM data into our construction projects has
        never been simpler.{' '}
        <strong>
          We’ve minimized on-site errors and improved communication across all
          stakeholders.
        </strong>{' '}
        This streamlined approach has saved us countless hours.
      </p>
    )
  },
  {
    name: 'David Klein',
    role: 'BIM Integration Lead at Bautopia GmbH',
    img: 'https://randomuser.me/api/portraits/men/7.jpg',
    description: (
      <p>
        As a growing firm, we needed a robust solution for our construction
        workflows. Clone it’s BIM integration{' '}
        <strong>
          allowed us to scale quickly while maintaining top-notch data accuracy.
        </strong>{' '}
        Absolutely crucial for our expanding project roster.
      </p>
    )
  },
  {
    name: 'Sarah Müller',
    role: 'Senior Construction Coordinator at Handwerkskraft',
    img: 'https://randomuser.me/api/portraits/women/25.jpg',
    description: (
      <p>
        Clone it’s multi-language support extends directly into our BIM tools,
        ensuring{' '}
        <strong>
          seamless collaboration between international design and construction
          teams.
        </strong>{' '}
        Coordinating site operations worldwide has become a breeze.
      </p>
    )
  },
  {
    name: 'Marcus Schröder',
    role: 'Operations Manager at Hochbau Innovations',
    img: 'https://randomuser.me/api/portraits/men/23.jpg',
    description: (
      <p>
        The analytics dashboard in Clone it gives us real-time insights into our
        BIM-driven construction progress.{' '}
        <strong>
          We’ve cut down on resource waste and seen a 40% uptick in on-time
          project completions.
        </strong>{' '}
        A total game-changer.
      </p>
    )
  },
  {
    name: 'Hanna Wolf',
    role: 'Chief Engineering Officer at BauSystems',
    img: 'https://randomuser.me/api/portraits/women/43.jpg',
    description: (
      <p>
        Clone it’s flexibility in integrating with our existing construction
        software has{' '}
        <strong>
          halved our response times to on-site issues and minimized cost
          overruns.
        </strong>{' '}
        The workflow automations are truly outstanding.
      </p>
    )
  },
  {
    name: 'Tobias Vogel',
    role: 'Sustainability Director at Grünbau Corp',
    img: 'https://randomuser.me/api/portraits/men/36.jpg',
    description: (
      <p>
        Using Clone it’s sustainability tracking within our BIM environment
        helps us monitor environmental impact on each site.{' '}
        <strong>
          We’re able to proactively adjust designs for eco-friendly operations.
        </strong>{' '}
        It’s a forward-thinking solution for green construction.
      </p>
    )
  },
  {
    name: 'Lisa Schulz',
    role: 'Inside Construction Manager at Quantum Bau',
    img: 'https://randomuser.me/api/portraits/women/16.jpg',
    description: (
      <p>
        From day one, Clone it’s BIM integration transformed our marketing
        approach to highlight{' '}
        <strong>
          real-time construction progress and site-specific benefits.
        </strong>{' '}
        Our client engagement skyrocketed once we shared accurate, up-to-date
        project data.
      </p>
    )
  },
  {
    name: 'Daniel Koch',
    role: 'Business Operations Lead at SwiftBau Solutions',
    img: 'https://randomuser.me/api/portraits/men/14.jpg',
    description: (
      <p>
        For healthcare construction projects, Clone it’s HIPAA-compliant
        features paired with BIM integration{' '}
        <strong>
          ensure secure and accurate patient-centric facility designs.
        </strong>{' '}
        It’s a must-have solution for specialized builds.
      </p>
    )
  },
  {
    name: 'Emma Hoffmann',
    role: 'Director of Client Relations at Spitzenbau Partners',
    img: 'https://randomuser.me/api/portraits/women/42.jpg',
    description: (
      <p>
        We’ve doubled our efficiency in educational facility construction using
        Clone it’s BIM modules.{' '}
        <strong>
          It centralizes student-centric design requirements and updates in one
          platform.
        </strong>{' '}
        An invaluable tool in academia-focused projects.
      </p>
    )
  },
  {
    name: 'Robert Wagner',
    role: 'Construction Enablement Manager at Catalyst Bau',
    img: 'https://randomuser.me/api/portraits/men/45.jpg',
    description: (
      <p>
        Clone it’s enterprise-grade security extends to our BIM datasets,
        guaranteeing{' '}
        <strong>
          total peace of mind when handling large-scale construction designs.
        </strong>{' '}
        It sets a new benchmark for data safety in our industry.
      </p>
    )
  },
  {
    name: 'Maya Schmitt',
    role: 'Customer Experience Director at Apex Konstruktion',
    img: 'https://randomuser.me/api/portraits/women/78.jpg',
    description: (
      <p>
        Clone it’s project management integration with BIM has{' '}
        <strong>
          revolutionized how we handle real-time collaboration between design
          teams and on-site crews.
        </strong>{' '}
        Communication gaps are virtually eliminated.
      </p>
    )
  },
  {
    name: 'Thomas Neumann',
    role: 'Sales Strategy Manager at Zukunft Dynamics',
    img: 'https://randomuser.me/api/portraits/men/54.jpg',
    description: (
      <p>
        The scalability of Clone it’s BIM-centric platform is ideal for our
        growing construction initiatives.{' '}
        <strong>
          It adapts effortlessly to new projects without overwhelming our
          current infrastructure.
        </strong>{' '}
        A true partner in modern construction.
      </p>
    )
  }
];
export function Testimonials(): React.JSX.Element {
  return (
    <GridSection hideVerticalGridLines>
      <div className="container border-x py-20 md:border-none">
        <h2 className="mb-8 text-center text-3xl font-semibold md:text-5xl lg:text-left">
          What people say
        </h2>
        <div className="relative mt-6 max-h-[540px] overflow-hidden">
          <div className="gap-4 md:columns-2 xl:columns-3 2xl:columns-4">
            {Array(Math.ceil(DATA.length / 3))
              .fill(0)
              .map((_, i) => (
                <Marquee
                  vertical
                  key={i}
                  className={cn({
                    '[--duration:60s]': i === 1,
                    '[--duration:30s]': i === 2,
                    '[--duration:70s]': i === 3
                  })}
                >
                  {DATA.slice(i * 3, (i + 1) * 3).map((testimonial, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: Math.random() * 0.4,
                        duration: 1
                      }}
                      className="mb-4 flex w-full break-inside-avoid flex-col items-center justify-between gap-6 rounded-xl border bg-background p-4 dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]"
                    >
                      <div className="select-none text-sm font-normal text-muted-foreground">
                        {testimonial.description}
                        <div className="flex flex-row py-1">
                          <Star className="size-4 fill-yellow-500 text-yellow-500" />
                          <Star className="size-4 fill-yellow-500 text-yellow-500" />
                          <Star className="size-4 fill-yellow-500 text-yellow-500" />
                          <Star className="size-4 fill-yellow-500 text-yellow-500" />
                          <Star className="size-4 fill-yellow-500 text-yellow-500" />
                        </div>
                      </div>
                      <div className="flex w-full select-none items-center justify-start gap-5">
                        <Image
                          width={40}
                          height={40}
                          src={testimonial.img || ''}
                          alt={testimonial.name}
                          className="size-8 rounded-full ring-1 ring-border ring-offset-4"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {testimonial.name}
                          </p>
                          <p className="text-xs font-normal text-muted-foreground">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </Marquee>
              ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 w-full bg-gradient-to-t from-background from-20%" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 w-full bg-gradient-to-b from-background from-20%" />
        </div>
      </div>
    </GridSection>
  );
}
