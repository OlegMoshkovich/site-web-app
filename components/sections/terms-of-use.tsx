import * as React from 'react';
import { AlertCircleIcon, BookIcon, ScaleIcon } from 'lucide-react';

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
    title: 'Einführung',
    icon: <BookIcon className="size-4 shrink-0" />,
    content:
      'Diese Bedingungen umreißen die Regeln für die Nutzung unserer Plattform. Durch die weitere Nutzung der Plattform stimmen Sie zu, diese einzuhalten.'
  },
  {
    title: 'Berechtigung',
    icon: <ScaleIcon className="size-4 shrink-0" />,
    content:
      'Benutzer müssen mindestens 18 Jahre alt sein und genaue Angaben machen, um ihre Konten zu pflegen.'
  },
  {
    title: 'Verbotene Nutzungen',
    icon: <AlertCircleIcon className="size-4 shrink-0" />,
    content:
      'Benutzer müssen es vermeiden, schädliche Inhalte zu posten, Malware zu verbreiten oder unbefugten Zugriff auf die Plattform zu versuchen.'
  }
];

const DATA_ACCORDION = [
  {
    title: 'Rechte an geistigem Eigentum',
    content:
      'Alle Inhalte der Plattform, einschließlich Marken und Materialien, sind unser Eigentum. Unbefugte Nutzung ist untersagt.'
  },
  {
    title: 'Benutzergenerierte Inhalte',
    content:
      'Sie behalten das Eigentum an den von Ihnen geposteten Inhalten, gewähren uns jedoch eine Lizenz zur Nutzung. Unangemessene Inhalte können nach unserem Ermessen entfernt werden.'
  },
  {
    title: 'Haftungsbeschränkung',
    content:
      "Unsere Plattform wird 'wie besehen' ohne Gewährleistungen bereitgestellt. Wir haften nicht für indirekte Schäden, und Benutzer übernehmen die damit verbundenen Risiken."
  },
  {
    title: 'Beendigung des Zugangs',
    content:
      'Wir können den Zugang bei Verstößen gegen diese Bedingungen, betrügerischen Aktivitäten oder anderen berechtigten Gründen aussetzen oder beenden.'
  },
  {
    title: 'Geltendes Recht und Streitigkeiten',
    content:
      'Diese Bedingungen unterliegen den Gesetzen von [Gerichtsbarkeit]. Streitigkeiten werden durch Schiedsverfahren oder benannte Gerichte beigelegt.'
  },
  {
    title: 'Änderungen der Bedingungen',
    content:
      'Wir behalten uns das Recht vor, diese Bedingungen zu aktualisieren. Änderungen werden hier veröffentlicht, und die fortgesetzte Nutzung gilt als Zustimmung.'
  }
];

export function TermsOfUse(): React.JSX.Element {
  return (
    <GridSection>
      <div className="container space-y-16 py-20">
        <SiteHeading
          badge="Rechtlich"
          title="Nutzungsbedingungen"
          description="Durch den Zugriff auf unsere Plattform stimmen Sie den unten aufgeführten Bedingungen zu. Bitte lesen Sie sie sorgfältig durch, um sicherzustellen, dass Sie Ihre Rechte und Pflichten verstehen."
        />
        {/* <Alert
          variant="warning"
          className="rounded-lg border border-yellow-500 dark:border-yellow-900"
        >
          <AlertDescription className="ml-3 text-base">
            Diese Bedingungen bieten einen allgemeinen Rahmen. Sie sollten von einem Rechtsanwalt überprüft und an Ihre Gerichtsbarkeit und Ihren Anwendungsfall angepasst werden.
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
