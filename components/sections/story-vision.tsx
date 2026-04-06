import * as React from 'react';

import { GridSection } from '@/components/marketing/fragments/grid-section';

export function StoryVision(): React.JSX.Element {
  return (
    <GridSection>
      <div className="container max-w-6xl py-20">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-8 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Unsere Mission
            </h2>
            <p className="text-2xl font-medium leading-relaxed md:text-3xl">
              "Wir sind hier, um die Zusammenarbeit im Bauwesen zu optimieren,
              indem wir die Lücke zwischen 2D-Zeichnungen und 3D-BIM-Modellen
              schließen."
            </p>
          </div>
          <div className="space-y-6 text-base text-muted-foreground md:text-lg">
            <p>
              Bauprojekte werden heute idealerweise vollständig BIM-basiert
              geplant. In der Ausführung hingegen bleibt das 3D-Planungsmodell
              oft ungenutzt. Stattdessen erschweren komplexe Papierpläne und
              Zettelwirtschaft ein ohnehin schon herausforderndes Projekt
              zusätzlich.
            </p>
            <p>
              Mit der clone:it Applikation können 3D-Planungsmodelle direkt auf
              der Baustelle interaktiv genutzt werden. So benötigen alle
              Beteiligten vor Ort keinen Papierplan mehr und können effizienter
              sowie fehlerfreier arbeiten.
            </p>
          </div>
        </div>
      </div>
    </GridSection>
  );
}
