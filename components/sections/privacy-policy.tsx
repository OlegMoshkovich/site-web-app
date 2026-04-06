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
      'Diese Datenschutzrichtlinie erklärt, wie wir Ihre persönlichen Daten sammeln, verwenden und schützen, wenn Sie mit unserer Plattform interagieren.'
  },
  {
    title: 'Informationssammlung',
    icon: <ScaleIcon className="size-4 shrink-0" />,
    content:
      'Wir sammeln Informationen, die Sie uns direkt zur Verfügung stellen, z. B. wenn Sie sich anmelden oder mit unseren Diensten interagieren.'
  },
  {
    title: 'Datennutzung',
    icon: <AlertCircleIcon className="size-4 shrink-0" />,
    content:
      'Wir verwenden Ihre Daten, um Ihre Erfahrung auf unserer Plattform zu bieten, zu personalisieren und zu verbessern, einschließlich Marketing und Support.'
  }
];

const DATA_ACCORDION = [
  {
    title: 'Wie wir Ihre Daten schützen',
    content:
      'Wir implementieren verschiedene Sicherheitsmaßnahmen, einschließlich Verschlüsselung und sicherer Speicherung, um Ihre persönlichen Informationen zu schützen.'
  },
  {
    title: 'Weitergabe an Dritte',
    content:
      'Wir können Ihre Daten mit vertrauenswürdigen Drittanbietern für wesentliche Operationen wie Zahlungsabwicklung oder Analysen teilen.'
  },
  {
    title: 'Benutzerrechte',
    content:
      'Sie haben das Recht, jederzeit auf Ihre persönlichen Daten zuzugreifen, sie zu aktualisieren oder zu löschen. Sie können auch Marketingkommunikationen abbestellen.'
  },
  {
    title: 'Cookies und Tracking',
    content:
      'Wir verwenden Cookies und ähnliche Technologien, um Ihre Erfahrung zu personalisieren und Nutzungsmuster auf unserer Website zu analysieren.'
  },
  {
    title: 'Änderungen dieser Richtlinie',
    content:
      'Wir können diese Datenschutzrichtlinie von Zeit zu Zeit aktualisieren. Änderungen werden hier veröffentlicht, und die fortgesetzte Nutzung der Plattform gilt als Zustimmung.'
  }
];

export function PrivacyPolicy(): React.JSX.Element {
  return (
    <GridSection>
      <div className="container space-y-16 py-20">
        <SiteHeading
          badge="Rechtlich"
          title="Datenschutzrichtlinie"
          description="Erfahren Sie, wie wir Ihre Daten sammeln, verwenden und schützen. Bitte lesen Sie sorgfältig, um unsere Praktiken zu verstehen."
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
