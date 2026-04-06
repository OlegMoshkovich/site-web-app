import * as React from 'react';
import { HardHat, MonitorStop, TabletSmartphone } from 'lucide-react';

import { BlurFade } from '@/components/marketing/fragments/blur-fade';
import { GridSection } from '@/components/marketing/fragments/grid-section';
import { TextGenerateWithSelectBoxEffect } from '@/components/marketing/fragments/text-generate-with-select-box-effect';

const DATA = [
  {
    icon: <MonitorStop className="size-5 shrink-0" />,
    title: 'BIM bleibt im Büro',
    description:
      'Fortschrittliche BIM-Modelle werden detailliert geplant – aber sie erreichen selten die Baustelle. So bleibt ihr Nutzen zur Optimierung des Bauablaufs und für fundierte Entscheidungen vor Ort oft ungenutzt.'
  },
  {
    icon: <HardHat className="size-5 shrink-0" />,
    title: 'Wertvolle Infos bleiben ungenutzt',
    description:
      'Professionisten vor Ort haben oft keinen Zugang zu den Modellen – oder nicht die passenden Tools, um sie einfach zu nutzen. So bleiben wichtige Erkenntnisse im Büro.'
  },
  {
    icon: <TabletSmartphone className="size-5 shrink-0" />,
    title: 'Nicht mobil gedacht',
    description:
      'Viele BIM-Lösungen sind für den Büroeinsatz gemacht – nicht für das Baufeld. Auf Tablets oder Smartphones lassen sich Modelle kaum sinnvoll nutzen. Das verhindert eine echte Integration in die tägliche Arbeit auf der Baustelle.'
  }
];

export function Problem(): React.JSX.Element {
  return (
    <GridSection>
      <div className="px-4 py-20 text-center">
        <h2 className="mb-2 text-xl font-medium text-muted-foreground md:text-2xl">
          Warum das volle Potenzial von BIM auf der Baustelle oft ungenutzt
          bleibt:
        </h2>
        <h1 className="text-3xl font-semibold md:text-5xl">
          <TextGenerateWithSelectBoxEffect words="BIM-Modelle mühelos dort nutzen, wo sie am meisten bewirken" />
        </h1>
      </div>
      <div className="grid md:grid-cols-3">
        {DATA.map((statement, index) => (
          <BlurFade
            key={index}
            inView
            delay={0.2 + index * 0.2}
            className="border-dashed px-8 py-12"
          >
            <div className="mb-7 flex size-12 items-center justify-center rounded-2xl border bg-background shadow">
              {statement.icon}
            </div>
            <h3 className="mb-3 text-lg font-semibold">{statement.title}</h3>
            <p className="text-muted-foreground">{statement.description}</p>
          </BlurFade>
        ))}
      </div>
    </GridSection>
  );
}
