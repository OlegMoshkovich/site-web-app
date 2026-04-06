'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CubeIcon } from '@radix-ui/react-icons';
import { motion } from 'framer-motion';
import { ChevronRightIcon } from 'lucide-react';

import { GridSection } from '@/components/marketing/fragments/grid-section';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  UnderlinedTabs,
  UnderlinedTabsContent,
  UnderlinedTabsList,
  UnderlinedTabsTrigger
} from '@/components/ui/tabs';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

function HeroPill(): React.JSX.Element {
  return (
    <motion.div
      initial={{ filter: 'blur(10px)', opacity: 0, y: -20 }}
      animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="flex items-center justify-center"
    >
      <Link href="https://www.linkedin.com/company/clone-it/">
        <Badge
          variant="outline"
          className="group h-10 rounded-xl px-3 text-xs font-medium shadow-sm duration-200 hover:bg-accent/50 sm:text-sm"
        >
          <div className="w-fit py-0.5 text-center text-xs text-[#009fe3] sm:text-sm">
            Neu!
          </div>
          <Separator
            orientation="vertical"
            className="mx-2"
          />
          Folgen Sie uns auf LinkedIn für Neuigkeiten.
          <ChevronRightIcon className="ml-1.5 size-3 shrink-0 text-foreground transition-transform group-hover:translate-x-0.5" />
        </Badge>
      </Link>
    </motion.div>
  );
}

function HeroTitle(): React.JSX.Element {
  return (
    <motion.div
      initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
      animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <h1 className="mt-2 text-center text-[48px] font-bold leading-[54px] tracking-[-1.2px] [font-kerning:none] sm:text-[56px] md:text-[64px] lg:text-[76px] lg:leading-[74px] lg:tracking-[-2px]">
        Die Lösung für
        <br /> eine digitale Baustelle
      </h1>
    </motion.div>
  );
}

function HeroDescription(): React.JSX.Element {
  return (
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="mx-auto mt-3 max-w-3xl text-balance text-center text-lg leading-[26px] text-muted-foreground sm:text-xl lg:mt-6"
    >
      clone:it bringt 3D-Planungsmodelle direkt auf die Baustelle, interaktiv,
      präzise und verständlich.
      <br />
      <br />
      Mit unserer Augmented-Reality-Lösung projizierst du BIM-Modelle im Maßstab
      1:1 in die reale Umgebung der Baustelle. So werden Informationen dort
      sichtbar und nutzbar, wo sie gebraucht werden: direkt vor Ort.
      <br />
      <br />
      Das Ergebnis: Planung und Ausführung greifen nahtlos ineinander – für
      weniger Missverständnisse, weniger Nacharbeit und mehr Effizienz im
      Bauprozess.
    </motion.p>
  );
}

function HeroButtons(): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="mx-auto flex w-full flex-col gap-2 px-7 sm:w-auto sm:flex-row sm:px-0"
    >
      <Link
        href={Routes.SignUp}
        className={cn(
          buttonVariants({ variant: 'default' }),
          'h-10 rounded-xl sm:h-9'
        )}
      >
        Anmelden
      </Link>
      <Link
        href={Routes.Contact}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'h-10 rounded-xl sm:h-9'
        )}
      >
        Kontakt aufnehmen
      </Link>
    </motion.div>
  );
}

function MainDashedGridLines(): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <svg className="absolute left-0 top-0 hidden h-full w-px [mask-image:linear-gradient(to_bottom,#0000,#000_128px,#000_calc(100%-24px),#0000)] lg:block">
        <line
          x1="0.5"
          y1="0"
          x2="0.5"
          y2="100%"
          strokeLinecap="round"
          strokeDasharray="5 5"
          stroke="hsl(var(--border))"
        />
      </svg>
      <svg className="absolute right-0 top-0 hidden h-full w-px [mask-image:linear-gradient(to_bottom,#0000,#000_128px,#000_calc(100%-24px),#0000)] lg:block">
        <line
          x1="0.5"
          y1="0"
          x2="0.5"
          y2="100%"
          strokeLinecap="round"
          strokeDasharray="5 5"
          stroke="hsl(var(--border))"
        />
      </svg>
    </motion.div>
  );
}

function HeroIllustration(): React.JSX.Element {
  const tabs = ['Bauherr', 'Bauunternehmen', 'Planer', 'Bildungseinrichtungen'];
  const content = [
    {
      title:
        'BIM-basiertes, kollaboratives Arbeiten für alle Projektbeteiligten',
      desc: 'Mit clone:it wird das geplante 3D-Modell einfach und intuitiv für alle Beteiligten zugänglich. In der Planungsphase, während der Ausführung oder beim Projektabschluss – Ihre Projektpartner können jederzeit gemeinschaftlich mit dem BIM-Modell arbeiten. So wird eine zentrale Informationsquelle genutzt und Missverständnisse im Bauablauf aktiv vermieden.',
      image: '/marketing/hero/hero-bauherr.webp'
    },
    {
      title: 'BIM auf der Baustelle – so einfach war Bauabwicklung noch nie',
      desc: 'Mit clone:it wird das 3D-Modell direkt vor Ort interaktiv genutzt. Planung und Ausführung greifen nahtlos ineinander. Informationen werden im Maßstab 1:1 in die reale Umgebung projiziert und stehen sofort zur Verfügung.',
      image: '/marketing/hero/hero-bauunternehmen.webp'
    },
    {
      title: 'Ihr Planungsmodell in Echtzeit zur Verfügung stellen',
      desc: 'Projektpartner projizieren das Modell in die reale Umgebung und greifen bauteilbezogen auf Informationen zu – oder hinterlegen diese direkt per Augmented Reality.',
      image: '/marketing/hero/hero-planer.webp'
    },
    {
      title:
        'Leicht verständlich: So einfach können komplexe Baugeometrien sein',
      desc: 'Mit der clone:it App können Bildungseinrichtungen 3D-Modelle anschaulich darstellen – direkt in der Umgebung oder visuell am Tablet und Smartphone.',
      image: '/marketing/hero/hero-bildungseinrichtung.webp'
    }
  ];

  const [activeTab, setActiveTab] = React.useState(0);
  const [lastInteraction, setLastInteraction] = React.useState(Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - lastInteraction;
      const delay = diff >= 15000 ? 0 : 12000 - diff;
      setTimeout(() => setActiveTab((prev) => (prev + 1) % tabs.length), delay);
    }, 12000);
    return () => clearInterval(interval);
  }, [lastInteraction, tabs.length]);

  return (
    <UnderlinedTabs
      value={tabs[activeTab]}
      onValueChange={(value) => {
        setActiveTab(tabs.indexOf(value));
        setLastInteraction(Date.now());
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="relative mb-14 mt-6"
      >
        <ScrollArea className="max-w-[100vw] lg:max-w-none">
          <UnderlinedTabsList className="relative z-20 mb-4 flex flex-row flex-wrap justify-center border-none before:hidden after:hidden">
            {tabs.map((label, index) => (
              <UnderlinedTabsTrigger
                key={label}
                value={label}
                className="relative mx-2 border-none px-4 py-3 text-base font-medium outline-none before:hidden after:hidden sm:text-lg"
              >
                <CubeIcon className="mr-2 size-4 shrink-0" />
                {label}
                {activeTab === index && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 8, ease: 'linear' }}
                  />
                )}
              </UnderlinedTabsTrigger>
            ))}
          </UnderlinedTabsList>
          <ScrollBar
            orientation="horizontal"
            className="invisible"
          />
        </ScrollArea>

        <UnderlinedTabsContent value={tabs[activeTab]}>
          <div className="container flex flex-col-reverse items-center gap-10 px-4 md:flex-row md:items-center md:gap-12">
            <div className="w-full text-left md:w-[48%]">
              <h3 className="mb-2 text-xl font-semibold text-primary">
                {content[activeTab].title}
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {content[activeTab].desc}
              </p>
            </div>
            <div className="w-full md:w-[52%]">
              <Image
                src={content[activeTab].image}
                width={640}
                height={400}
                alt={content[activeTab].title}
                className="rounded-xl"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          </div>
        </UnderlinedTabsContent>
      </motion.div>
    </UnderlinedTabs>
  );
}

export function Hero(): React.JSX.Element {
  return (
    <GridSection className="overflow-x-hidden">
      <div className="mx-auto mt-10 flex flex-col gap-6 px-2 sm:mt-14 sm:px-1 md:mt-20 lg:mt-24">
        <div className="gap-2">
          <HeroTitle />
        </div>
        <HeroDescription />
        <HeroIllustration />
      </div>
    </GridSection>
  );
}
