import * as React from 'react';

import { GridSection } from '@/components/marketing/fragments/grid-section';

const DATA = [
  {
    date: '2022',
    title: 'Die Idee entsteht',
    description:
      'Paul und Liebhard erkannten die Herausforderung, BIM-Modelle auf Baustellen zugänglich zu machen, und legten damit den Grundstein für clone:it.'
  },
  {
    date: '2023',
    title: 'Vom Konzept zur Realität',
    description:
      'Die clone:it GmbH wurde offiziell gegründet. Die erste Entwicklung konzentrierte sich auf Kernfunktionen, mit frühen Tests in Zusammenarbeit mit Branchenpartnern.'
  },
  {
    date: 'Q1 2024',
    title: 'Wachsende Anerkennung',
    description:
      'Erste Proof-of-Concept-Demonstrationen mit Hochtief, STRABAG und weiteren führenden Bauunternehmen. Teilnahme an großen Branchenveranstaltungen wie digitalBAU 2024 und Sicherung eines Platzes bei der BIM World Munich.'
  },
  {
    date: 'Q3 2024',
    title: 'Dynamischer Fortschritt',
    description:
      'Start unseres 100-tägigen PoC mit der Deutschen Bahn, Partnerschaft mit dem TUM Venture Lab, Teilnahme an mehreren Branchenveranstaltungen und Wettbewerben sowie Erweiterung der Produktpalette um Issue Tracking und Fortschrittskontrolle.'
  },
  {
    date: '2025',
    title: 'Skalierung mit echten Kunden',
    description:
      'clone:it entwickelt sich von Pilotprojekten zur breiten Branchenadoption, sichert langfristige Verträge mit Bauunternehmen und Berufsschulen. Der Fokus liegt auf der Optimierung von Workflows, der Skalierbarkeit und der Expansion in neue Märkte.'
  },
  {
    date: 'Zukunft',
    title: 'Die Bauindustrie transformieren',
    description:
      'Erweiterung der Grenzen von AR in der Baubranche, Förderung KI-gestützter BIM-Workflows und Vorantreiben der digitalen Transformation in der Industrie.'
  }
];

export function StoryTimeline(): React.JSX.Element {
  return (
    <GridSection>
      <div className="container max-w-6xl py-20">
        <h2 className="mb-16 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Der bisherige Weg
        </h2>
        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-0.5 bg-border" />
          <div className="space-y-16">
            {DATA.map((milestone, index) => (
              <div
                key={index}
                className="relative pl-12"
              >
                <div className="absolute left-0 top-1 flex size-8 items-center justify-center rounded-full border bg-background">
                  <div className="size-2.5 rounded-full bg-primary" />
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {milestone.date}
                </div>
                <h3 className="mb-4 text-xl font-medium">{milestone.title}</h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {milestone.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GridSection>
  );
}
