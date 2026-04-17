'use client';

import * as React from 'react';
import { CubeIcon } from '@radix-ui/react-icons';
import { motion } from 'framer-motion';

import { GridSection } from '@/components/marketing/fragments/grid-section';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  UnderlinedTabs,
  UnderlinedTabsContent,
  UnderlinedTabsList,
  UnderlinedTabsTrigger
} from '@/components/ui/tabs';

function HeroIllustration(): React.JSX.Element {
  const tabs = React.useMemo(() => ['3D Desktop', '3D App', 'AR Ansicht'], []);

  const content = [
    {
      title: 'BIM-Modelle im Browser prüfen und verwalten',
      desc: 'Mit clone:it kannst du deine BIM-Modelle ganz einfach im Browser anzeigen, prüfen und verwalten. Nutze alle Funktionen wie Baufortschrittskontrolle, Informationsabruf und Modellnavigation – ohne zusätzliche Software.'
    },
    {
      title: 'Informationen abrufen und erfassen – direkt im Modell',
      desc: 'Mit der mobilen App kannst du BIM-Modelle überall interaktiv erleben. Greife bauteilbezogene Informationen ab oder erfasse neue Infos direkt im Modell – alles bequem auf dem iPad oder iPhone.'
    },
    {
      title: 'Modelle in 1:1 auf der Baustelle platzieren',
      desc: 'Projiziere dein BIM-Modell in Augmented Reality direkt auf die Baustelle. Sieh das geplante Bauwerk im Maßstab 1:1, überprüfe die Ausführung visuell und dokumentiere Erkenntnisse oder Probleme direkt im AR-Modell.'
    }
  ];

  const videoSources = [
    '/marketing/hero/Solution_Overview_3D__DESKTOP.webm',
    '/marketing/hero/Solution_Overview_3D_VID.webm',
    '/marketing/hero/SolutionsOverview_AR.webm'
  ];

  const [activeTab, setActiveTab] = React.useState('feature1');
  const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([]);
  const tabPlaybackEnabledRef = React.useRef(false);

  const activeVideoIndex =
    Number(activeTab.replace(/\D/g, '')) - 1;

  React.useEffect(() => {
    if (!tabPlaybackEnabledRef.current) return;
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === activeVideoIndex) {
        void video.play();
      } else {
        video.pause();
      }
    });
  }, [activeTab, activeVideoIndex]);

  const handleVideoEnd = (index: number) => {
    tabPlaybackEnabledRef.current = true;
    setActiveTab(`feature${((index + 1) % tabs.length) + 1}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="relative mt-3 lg:mt-6"
    >
      <h1 className="mb-10 text-center text-5xl font-extrabold">
        BIM auf der Baustelle – So einfach wie nie!
      </h1>

      <UnderlinedTabs
        value={activeTab}
        onValueChange={(value) => {
          tabPlaybackEnabledRef.current = true;
          setActiveTab(value);
        }}
        className="mt-4"
      >
        <ScrollArea className="max-w-[100vw] lg:max-w-none">
          <UnderlinedTabsList className="relative z-20 mb-6 flex h-fit flex-wrap justify-center space-x-3 border-none md:space-x-6">
            {tabs.map((label, index) => (
              <UnderlinedTabsTrigger
                key={index}
                value={`feature${index + 1}`}
                className="relative mx-1 border-none px-2.5 text-base outline-none sm:mx-2 sm:px-3 sm:text-lg"
              >
                <CubeIcon className="mr-2 size-5 shrink-0" />
                {label}
                {activeTab === `feature${index + 1}` && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 10, ease: 'linear' }}
                  />
                )}
              </UnderlinedTabsTrigger>
            ))}
          </UnderlinedTabsList>
        </ScrollArea>

        <div className="relative mb-1 w-full rounded-xl dark:border-none dark:bg-background">
          <div className="relative z-20 bg-background p-8">
            {tabs.map((_, index) => (
              <UnderlinedTabsContent
                key={index}
                value={`feature${index + 1}`}
              >
                <div className="flex flex-col gap-12 lg:flex-row">
                  <div className="flex flex-col justify-center p-6 text-left lg:w-1/2">
                    <h3 className="mb-2 text-xl font-semibold text-primary sm:text-2xl">
                      {content[index].title}
                    </h3>
                    <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                      {content[index].desc}
                    </p>
                  </div>
                  <div className="lg:w-2/3">
                    <video
                      ref={(el) => {
                        videoRefs.current[index] = el;
                      }}
                      src={videoSources[index]}
                      width="1000"
                      height="550"
                      controls
                      playsInline
                      preload="metadata"
                      onEnded={() => handleVideoEnd(index)}
                      className="rounded-xl"
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </div>
                </div>
              </UnderlinedTabsContent>
            ))}
          </div>
        </div>
      </UnderlinedTabs>
    </motion.div>
  );
}

export function SolutionOverview(): React.JSX.Element {
  return (
    <GridSection className="overflow-x-hidden">
      <div className="lg:mt-18 mx-auto mt-6 flex flex-col gap-4 px-2 sm:mt-10 sm:px-1 md:mt-14">
        <HeroIllustration />
      </div>
    </GridSection>
  );
}
