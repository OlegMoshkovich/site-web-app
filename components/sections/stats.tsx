import * as React from 'react';

import { GridSection } from '@/components/marketing/fragments/grid-section';
import { NumberTicker } from '@/components/marketing/fragments/number-ticket';
import { cn } from '@/lib/utils';

const DATA = [
  {
    value: 100,
    suffix: '%',
    title: 'Datenübersicht',
    description: 'Alle Daten sind bauteilbezogen im BIM-Modell hinterlegt.'
  },
  {
    value: 20,
    suffix: '%',
    title: 'Effektiver',
    description:
      'Fotodokumentation ist bauteilbezogen abrufbar - Protokolle werden automatisch erstellt.'
  },
  {
    value: 22,
    suffix: 'min',
    title: 'Zeiteinsparung',
    description:
      'Ersparnis pro erfassten Fehler - durch kollaborative Zusammenarbeit im Projekt keine E-Mail-Flut.'
  },
  {
    value: 95,
    suffix: '%',
    title: 'Benutzerfreundlichkeit',
    description:
      'Anwendung beim Polieren und Bauleitern dank hoher Benutzerfreundlichkeit'
  }
];

export function Stats(): React.JSX.Element {
  return (
    <GridSection>
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {DATA.map((stat, index) => (
          <div
            key={index}
            className="flex min-h-[150px] flex-col items-center p-6 text-center lg:p-8"
          >
            {/* Number with suffix */}
            <p className="flex items-center text-2xl font-semibold md:text-3xl">
              <NumberTicker value={stat.value} />
              <span className="ml-1">{stat.suffix}</span>
            </p>

            {/* Title under the number */}
            <p className="mt-1 text-sm font-medium text-gray-600">
              {stat.title}
            </p>

            {/* Description under the title */}
            <p className="mt-2 max-w-[90%] break-words text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </GridSection>
  );
}
