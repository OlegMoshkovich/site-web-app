import * as React from 'react';
import { BookIcon, CookieIcon, ScaleIcon } from 'lucide-react';

import { GridSection } from '@/components/marketing/fragments/grid-section';
import { SiteHeading } from '@/components/marketing/fragments/site-heading';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DATA_CARDS = [
  {
    title: 'Was sind Cookies?',
    icon: <CookieIcon className="size-4 shrink-0" />,
    content:
      'Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden und uns helfen, Ihre Erfahrung zu verbessern, indem sie Präferenzen speichern.'
  },
  {
    title: 'Arten von Cookies',
    icon: <BookIcon className="size-4 shrink-0" />,
    content:
      'Wir verwenden sowohl Sitzungs- als auch dauerhafte Cookies, um Benutzeraktivitäten zu verfolgen und die Funktionalität der Website zu verbessern.'
  },
  {
    title: 'Verwaltung von Cookies',
    icon: <ScaleIcon className="size-4 shrink-0" />,
    content:
      'Sie können die Cookie-Einstellungen in Ihrem Browser steuern. Das Deaktivieren von Cookies kann jedoch Ihre Erfahrung auf unserer Website beeinträchtigen.'
  }
];

const DATA_ACCORDION = [
  {
    title: 'Cookies, die wir verwenden',
    content:
      'Wir verwenden Cookies für Funktionalität (z.B. Login-Sitzungen), Leistung (z.B. Analysen) und Werbung (z.B. gezielte Anzeigen).'
  },
  {
    title: 'Cookies von Drittanbietern',
    content:
      'Wir können Drittanbietern (wie Google Analytics) erlauben, Cookies auf Ihrem Gerät für bestimmte Zwecke zu platzieren.'
  },
  {
    title: 'Wie man Cookies verwaltet',
    content:
      'Sie können die Cookie-Einstellungen in Ihrem Browser anpassen. Für detailliertere Anweisungen konsultieren Sie bitte die Hilfe Ihres Browsers.'
  },
  {
    title: 'Änderungen unserer Cookie-Richtlinie',
    content:
      'Wir können diese Cookie-Richtlinie von Zeit zu Zeit aktualisieren. Alle Änderungen werden auf dieser Seite veröffentlicht.'
  }
];

export function CookiePolicy(): React.JSX.Element {
  return (
    <GridSection>
      <div className="container space-y-16 py-20">
        <SiteHeading
          badge="Rechtlich"
          title="Cookie-Richtlinie"
          description="Erfahren Sie, wie wir Cookies und ähnliche Technologien verwenden, um Ihre Erfahrung auf unserer Plattform zu verbessern."
        />
        {/* <Alert
          variant="warning"
          className="rounded-lg border border-yellow-500 dark:border-yellow-900"
        >
          <AlertDescription className="ml-3 text-base">
            Diese Richtlinie bietet einen allgemeinen Rahmen. Sie sollte von einem Rechtsanwalt überprüft und an Ihre Gerichtsbarkeit und Ihren Anwendungsfall angepasst werden.
          </AlertDescription>
        </Alert> */}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DATA_CARDS.map((item, index) => (
            <Card
              key={index}
              className="border-none dark:bg-accent/40"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {item.icon}
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Accordion
          type="single"
          collapsible
        >
          {DATA_ACCORDION.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
            >
              <AccordionTrigger className="flex items-center justify-between text-lg font-medium">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div>
          <CardTitle className="text-lg text-primary">
            Kontaktinformationen
          </CardTitle>
          <p className="text-sm leading-relaxed">
            Bei Fragen oder Bedenken kontaktieren Sie uns unter:
            <br />
            <a
              href="mailto:asse.boerties@cloneit.at"
              className="text-blue-500 hover:underline"
            >
              asse.boerties@cloneit.at
            </a>
          </p>
        </div>
      </div>
    </GridSection>
  );
}
