import * as React from 'react';
import Link from 'next/link';

import { GridSection } from '@/components/marketing/fragments/grid-section';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
// import { AppInfo } from '@/constants/app-info';
import { Routes } from '@/constants/routes';

const DATA = [
  {
    question: 'Was macht clone:it?',
    answer: `clone:it zeigt BIM-Modelle direkt auf der Baustelle – in Originalgröße auf Tablet oder Smartphone mit Augmented Reality (AR). Wichtige Infos zur Ausführung und Bauteilprüfung sind sofort sichtbar oder direkt im Modell gespeichert. Außerdem lassen sich Prüfprotokolle, Checklisten und Fotos digital im Modell erfassen.`
  },
  {
    question: 'Was ist der Vorteil für mein Bauprojekt?',
    answer: `In der Planung wird das BIM-Modell vollumfänglich genutzt, doch auf der Baustelle arbeiten viele Beteiligte noch mit ausgedruckten 2D-Papierplänen.

    Mit der clone:it App können sie direkt auf der Baustelle mit dem BIM-Modell arbeiten. 
    Facharbeiter, Poliere, Bauleiter und Projektleiter nutzen die App, um die Baustelle einfacher und damit effizienter abzuwickeln.

    Komplexe Baupläne müssen nicht mehr ausgedruckt und mühsam vor Ort mit erfahrenen Kollegen besprochen werden, um sie zu verstehen. 
    Stattdessen sind Bauobjekte dank der Nutzung des BIM-Modells leicht verständlich und direkt auf dem Tablet oder Smartphone abrufbar.`
  },
  {
    question: 'Wie einfach ist es, mein Baustellen-Team einzuarbeiten?',
    answer:
      'Für clone:it war es von Anfang an besonders wichtig, dass die Applikation für die Anwender einfach und intuitiv zu bedienen ist. Das Entwickler-Team von clone:it besteht sowohl aus Softwareentwicklern als auch Bauingenieuren, sodass die Abstimmung zwischen den Bedürfnissen der Baustelle und einer optimierten, vereinfachten Arbeitsweise im Vordergrund steht.'
  },
  {
    question: 'Welche Bau-Gewerke können clone:it nutzen?',
    answer: `clone:it ist speziell für das Bauhandwerk konzipiert. Die Herstellung von Bauteilen wird durch die Nutzung von 3D-Modellen erheblich vereinfacht. Komplexe Baugeometrien lassen sich mühelos in 3D visualisieren oder direkt im Maßstab 1:1 auf die Baustelle projizieren. Ob Facharbeiter, Poliere oder Bauleiter – alle, die auf der Baustelle mit Papierplänen arbeiten, können die clone:it Applikation nutzen. Dadurch lassen sich wesentliche Informationen für den Bauablauf deutlich einfacher abrufen und verwenden.`
  },
  {
    question:
      'Kann ich clone:it an meine spezifischen Bauanforderungen anpassen?',
    answer:
      'Absolut! clone:it bietet zwei zentrale Lösungen: die clone:it Web-Plattform und die clone:it Applikation. Auf der Web-Plattform kann das Projekt bereits vor dem Baubeginn vorbereitet werden. Sie können für Ihr Baustellenteam klare Strukturen schaffen. Dabei haben Sie die Möglichkeit, entweder voreingestellte Projektparameter abzurufen oder selbst zu definieren, welche Informationen bereitgestellt werden müssen.'
  }
];

export function FAQ(): React.JSX.Element {
  return (
    <GridSection>
      <div className="container px-4 py-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="text-center lg:text-left">
            <h2 className="mb-2.5 text-3xl font-semibold md:text-5xl">
              Häufig gestellte Fragen
            </h2>
            <p className="mt-6 hidden text-muted-foreground md:block lg:max-w-[75%]">
              Haben Sie nicht gefunden, wonach Sie suchen? Versuchen Sie,{' '}
              <Link
                href={Routes.Contact}
                className="font-normal text-inherit underline hover:text-foreground"
              >
                uns zu kontaktieren
              </Link>{' '}
              wir helfen Ihnen gerne weiter.
            </p>
          </div>
          <div className="mx-auto flex w-full max-w-xl flex-col">
            <Accordion
              type="single"
              collapsible
            >
              {DATA.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={index.toString()}
                >
                  <AccordionTrigger className="text-left text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </GridSection>
  );
}
