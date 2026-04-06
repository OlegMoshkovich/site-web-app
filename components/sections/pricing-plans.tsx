import * as React from 'react';
import Link from 'next/link';
import { CheckIcon, ChevronRight } from 'lucide-react';

import { GridSection } from '@/components/marketing/fragments/grid-section';
import { SiteHeading } from '@/components/marketing/fragments/site-heading';
import { buttonVariants } from '@/components/ui/button';
import { AppInfo } from '@/constants/app-info';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

enum Feature {
  WebApp = 'Web App',
  MobileApp = 'Mobile App',
  MobileViewer = 'Mobiler 3D-Viewer',
  MobileARViewer = 'Mobiler AR-Viewer',
  Users = 'Benutzer',
  Projects = 'Projekte',
  Uploads = 'Uploads'
}

const plans = {
  free: {
    [Feature.WebApp]:
      'Erhalten Sie eingeschränkten Zugang zu unserer Web-Plattform',
    [Feature.MobileViewer]: 'Erhalten Sie Zugang zu unserem Web-3D-Viewer',
    [Feature.Users]: 'Begrenzt auf 1 Benutzer',
    [Feature.Projects]: 'Begrenzt auf 1 Testprojekt',
    [Feature.Uploads]: 'Begrenzt auf 5 Testprojekte'
  },
  enterprise: {
    [Feature.WebApp]:
      'Genießen Sie vollen Zugang zu unserer umfassenden Web-Plattform für nahtloses Projektmanagement',
    [Feature.MobileApp]:
      'Schalten Sie das volle Potenzial unserer mobilen Apps frei, die für die Zusammenarbeit unterwegs entwickelt wurden',
    [Feature.MobileViewer]:
      'Interagieren Sie mit Ihren BIM-Modellen mit unserem fortschrittlichen mobilen 3D-Viewer',
    [Feature.MobileARViewer]:
      'Erleben Sie Ihre BIM-Modelle in realen Umgebungen mit unserer Augmented-Reality-Funktion',
    [Feature.Users]:
      'Skalieren Sie Ihr Team, indem Sie die Anzahl der benötigten Benutzer auswählen',
    [Feature.Projects]:
      'Erstellen und verwalten Sie mühelos unbegrenzt viele Projekte',
    [Feature.Uploads]:
      'Laden Sie eine unbegrenzte Anzahl von BIM-Modellen für Ihre Projekte hoch'
  }
} as const;

export function PricingPlans(): React.JSX.Element {
  return (
    <GridSection>
      <div className="container space-y-20 py-20">
        <SiteHeading
          badge="Ihr Plan"
          title="Flexible Pläne, für Sie gemacht"
          description={`Egal, ob Sie in der Schule, im Büro oder auf der Baustelle sind, ${AppInfo.APP_NAME} bietet eine Lösung, die auf Ihre Bedürfnisse zugeschnitten ist.`}
        />

        <div className="max-w-7xl">
          <div className="flex justify-center">
            <div className="mx-auto grid w-full max-w-6xl gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <FreeTierCard />
              {/* <ProTierCard /> */}
              <EnterpriseTierCard />
            </div>
          </div>
        </div>
      </div>
    </GridSection>
  );
}

function FreeTierCard(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col rounded-lg border p-8">
      <div className="relative z-10 grow">
        <div className="mb-8">
          <h2 className="mb-2 text-xl font-medium">Testversion</h2>
          <div className="mb-2 flex items-baseline">
            <span className="text-4xl font-bold">€0</span>
            <span className="ml-2 text-muted-foreground">/Nutzer/Monat</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Für Einzelpersonen, die den ersten Schritt zur Freischaltung des
            vollen Potenzials ihrer BIM-Modelle machen
          </p>
        </div>
        <ul className="mb-8 space-y-4">
          {Object.keys(plans.free).map((key) => (
            <li
              key={key}
              className="flex items-start"
            >
              <CheckIcon className="mt-1 size-4 text-muted-foreground" />
              <div className="ml-3">
                <div className="text-sm font-medium">{key}</div>
                <div className="text-sm text-muted-foreground">
                  {plans.free[key as keyof typeof plans.free]}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Link
        // href={Routes.SignUp}
        href={Routes.Contact}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'group mt-auto h-11 w-full rounded-xl text-sm font-medium shadow-none transition-colors duration-200'
        )}
      >
        Testversion anfordern
        <ChevronRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function EnterpriseTierCard(): React.JSX.Element {
  return (
    <div className="relative col-span-1 flex h-full flex-col rounded-lg border p-8 md:col-span-2 lg:col-span-1">
      <div className="relative z-10 flex grow flex-col justify-start md:flex-row md:justify-between lg:flex-col lg:justify-start">
        <div className="mb-8">
          <h2 className="mb-2 text-xl font-medium">Enterprise</h2>
          <div className="mb-2 flex items-baseline">
            <span className="text-4xl font-bold">Flexibel</span>
            <span className="ml-2 text-muted-foreground">/Nutzer/Monat</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Für Organisationen, die maßgeschneiderte Lösungen suchen, um die
            Effizienz mit der Kraft von BIM-Modellen in jeder Phase ihrer
            Projekte zu maximieren
          </p>
        </div>
        <ul className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
          {Object.keys(plans.enterprise).map((key) => (
            <li
              key={key}
              className="flex items-start"
            >
              <CheckIcon className="mt-1 size-4 text-muted-foreground" />
              <div className="ml-3">
                <div className="text-sm font-medium">{key}</div>
                <div className="text-sm text-muted-foreground">
                  {plans.enterprise[key as keyof typeof plans.enterprise]}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={Routes.Contact}
        className={cn(
          buttonVariants({ variant: 'default' }),
          'group mt-auto h-11 w-full rounded-xl bg-blue-600 text-white shadow-none transition-colors duration-200 hover:bg-blue-700'
        )}
      >
        Kontaktieren Sie uns
        <ChevronRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
