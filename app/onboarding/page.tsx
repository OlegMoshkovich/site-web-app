"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  MapPin, 
  Tag, 
  Upload, 
  Users, 
  Smartphone,
  Globe,
  CheckCircle
} from "lucide-react";
import Image from "next/image";
import { useLanguage, useTranslations } from "@/lib/translations";

// Simplified onboarding - no data collection needed

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Simple Site',
    description: 'Your platform for collaborative site observations',
    icon: Globe
  },
  {
    id: 'about-sites',
    title: 'Sites',
    description: 'Learn how to create and manage observation sites in Settings',
    icon: MapPin
  },
  {
    id: 'about-labels',
    title: 'Observation Labels',
    description: 'Learn how to create labels to categorize observations in Settings',
    icon: Tag
  },
  {
    id: 'about-plans',
    title: 'Site Plans',
    description: 'Learn how to upload floor plans or site maps in Settings',
    icon: Upload
  },
  {
    id: 'about-collaboration',
    title: 'Team Collaboration',
    description: 'Learn how to invite team members to collaborate in Settings',
    icon: Users
  },
  {
    id: 'mobile-app',
    title: 'Get the Mobile App',
    description: 'Download the app to collect observations in the field',
    icon: Smartphone
  },
  {
    id: 'existing-team',
    title: 'You\'re already part of a team!',
    description: 'We found existing collaborations for your account',
    icon: Users
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Your site is ready for observations',
    icon: CheckCircle
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { language } = useLanguage();
  const t = useTranslations(language);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [hasExistingSites, setHasExistingSites] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Check if user already has a profile and completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      console.log('Onboarding page - profile check:', { profile, profileError });

      // If profile exists AND onboarding is completed, redirect to main app
      if (profile && profile.onboarding_completed) {
        console.log('User has completed onboarding - redirecting to main app');
        router.push('/');
        return;
      }

      // If profiles table doesn't exist, this is an existing installation - skip onboarding
      if (profileError?.message.includes('relation "public.profiles" does not exist')) {
        router.push('/');
        return;
      }

      // If we get here, user needs to complete onboarding
      console.log('User needs to complete onboarding - staying on page');

      setUser(user);

      // Check if user has existing sites (through collaborations or ownership)
      const { data: collaborations } = await supabase
        .from('site_collaborators')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      setHasExistingSites((collaborations && collaborations.length > 0) || false);
    };
    checkUser();
  }, [router, supabase]);

  const nextStep = () => {
    const visibleSteps = getVisibleSteps();
    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };



  const completeOnboarding = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Simply mark onboarding as complete
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          onboarding_completed: true
        });

      console.log('Onboarding completed successfully');
      // Redirect to main app
      router.push('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('There was an error completing onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    const visibleSteps = getVisibleSteps();
    const step = visibleSteps[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto flex items-center justify-center">
              <Image
                src="/images/icon.png"
                alt="Simple Site Icon"
                width={80}
                height={80}
                className="h-20 w-20 rounded-md border border-border bg-background"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">{t('welcomeToSimpleSite')}</h2>
              <p className="mx-auto max-w-md text-muted-foreground">
                {t('welcomeDescription')}
              </p>
              
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-left">
                <h3 className="mb-2 font-semibold text-foreground">{t('whatYouCanDo')}</h3>
                <ul className="space-y-1 text-sm text-foreground">
                  <li>• {t('createAndManageObservationSites')}</li>
                  <li>• {t('collaborateWithTeamMembers')}</li>
                  <li>• {t('collectObservationsWithPhotos')}</li>
                  <li>• {t('generateReportsAndExportData')}</li>
                  <li>• {t('useOurMobileAppForFieldWork')}</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'existing-team':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">{t('youreAlreadyPartOfATeam')}</h2>
              <p className="text-muted-foreground">{t('foundExistingCollaborations')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 dark:bg-emerald-950/30">
                <p className="mb-3 text-sm text-foreground">
                  {t('skipIntroductionAndStart')}
                </p>
                <Button 
                  onClick={completeOnboarding}
                  variant="outline"
                  className="w-full border-emerald-600/40 text-foreground hover:bg-emerald-500/10 dark:border-emerald-500/40"
                >
                  {t('goToMySites')}
                </Button>
              </div>
              
            </div>
          </div>
        );

      case 'about-sites':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">{t('sites')}</h2>
              <p className="text-muted-foreground">{t('siteIsLocation')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold text-foreground">{t('whatYouCanDo')}</h3>
                <ul className="space-y-1 text-sm text-foreground">
                  <li>• {t('createMultipleObservationSites')}</li>
                  <li>• {t('addDescriptionsAndDetails')}</li>
                  <li>• {t('manageSiteCollaborators')}</li>
                  <li>• {t('uploadSitePlansAndReference')}</li>
                </ul>
              </div>
              
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 dark:bg-primary/10">
                <p className="text-sm text-foreground">
                  <strong>{t('toCreateSites')}</strong> {t('goToSettingsSiteManagement')}
                </p>
              </div>
            </div>
          </div>
        );

      case 'about-labels':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Tag className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">{t('observationLabels')}</h2>
              <p className="text-muted-foreground">{t('labelsHelpCategorize')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold text-foreground">{t('whatYouCanDo')}</h3>
                <ul className="space-y-1 text-sm text-foreground">
                  <li>• {t('createHierarchicalLabelSystems')}</li>
                  <li>• {t('organizeLabelsByLocation')}</li>
                  <li>• {t('useLabelsToFilter')}</li>
                  <li>• {t('shareLabelsAcrossTeam')}</li>
                </ul>
              </div>
              
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-sm text-foreground">
                  <strong>{t('commonLabelExamples')}</strong> {t('issueProgressCompleted')}
                </p>
              </div>
              
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 dark:bg-primary/10">
                <p className="text-sm text-foreground">
                  <strong>{t('toCreateLabels')}</strong> {t('goToSettingsLabelManagement')}
                </p>
              </div>
            </div>
          </div>
        );

      case 'about-plans':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Upload className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">{t('sitePlans')}</h2>
              <p className="text-muted-foreground">{t('uploadFloorPlansOrSiteMaps')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold text-foreground">{t('whatYouCanDo')}</h3>
                <ul className="space-y-1 text-sm text-foreground">
                  <li>• {t('uploadFloorPlansSiteMaps')}</li>
                  <li>• {t('supportForImages')}</li>
                  <li>• {t('pinObservationsDirectly')}</li>
                  <li>• {t('shareVisualContext')}</li>
                </ul>
              </div>
              
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-sm text-foreground">
                  {t('plansHelpTeamMembers')}
                </p>
              </div>
              
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 dark:bg-primary/10">
                <p className="text-sm text-foreground">
                  <strong>{t('toUploadPlans')}</strong> {t('goToSettingsPlanManagement')}
                </p>
              </div>
            </div>
          </div>
        );

      case 'about-collaboration':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">{t('teamCollaboration')}</h2>
              <p className="text-muted-foreground">{t('addTeamMembersToCollaborate')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold text-foreground">{t('whatYouCanDo')}</h3>
                <ul className="space-y-1 text-sm text-foreground">
                  <li>• {t('inviteTeamMembersViaEmail')}</li>
                  <li>• {t('setDifferentPermissionLevels')}</li>
                  <li>• {t('viewTeamObservationsRealTime')}</li>
                  <li>• {t('manageCollaboratorAccess')}</li>
                </ul>
              </div>
              
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-sm text-foreground">
                  {t('teamMembersWillReceive')}
                </p>
              </div>
              
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 dark:bg-primary/10">
                <p className="text-sm text-foreground">
                  <strong>{t('toInviteTeamMembers')}</strong> {t('goToSettingsCollaborationManagement')}
                </p>
              </div>
            </div>
          </div>
        );

      case 'mobile-app':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Smartphone className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">{t('getTheMobileApp')}</h2>
              <p className="text-muted-foreground">{t('essentialForCollecting')}</p>
            </div>
            
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-gradient-to-br from-muted/80 to-muted p-6 dark:from-muted/50 dark:to-muted/80">
                <h3 className="mb-3 font-semibold text-foreground">{t('simpleSiteMobileApp')}</h3>
                <ul className="mb-4 space-y-2 text-sm text-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {t('takePhotosAndAddNotes')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {t('gpsLocationTracking')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {t('automaticSyncWithSites')}
                  </li>
                </ul>
                
                <div className="flex justify-center">
                  <a 
                    href="https://apps.apple.com/us/app/simple-site/id6749160249"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-opacity hover:opacity-80"
                  >
                    <Image
                      src="/app_screens/available-app-store_1.png"
                      alt={t('availableOnAppStore')}
                      width={120}
                      height={40}
                      className="h-auto w-auto object-contain"
                    />
                  </a>
                </div>
              </div>
              
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 dark:bg-primary/10">
                <div className="text-sm text-foreground">
                  <p className="mb-2 font-semibold">{t('webVsMobile')}</p>
                  <ul className="space-y-1">
                    <li>• <strong>{t('webPortal')}</strong> {t('viewTeamObservationsGenerateReports')}</li>
                    <li>• <strong>{t('mobileApp')}</strong> {t('requiredForCollectingObservations')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">{t('youreAllSet')}</h2>
              <p className="mx-auto max-w-md text-muted-foreground">
                {t('welcomeToSimpleSiteComplete')}
              </p>
              
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-left">
                <h3 className="mb-2 font-semibold text-foreground">{t('whatsNext')}</h3>
                <ul className="space-y-1 text-sm text-foreground">
                  <li>• {t('goToSettingsCreateFirstSite')}</li>
                  <li>• {t('setupObservationLabelsUploadPlans')}</li>
                  <li>• {t('inviteTeamMembersToCollaborate')}</li>
                  <li>• {t('downloadMobileAppForFieldWork')}</li>
                  <li>• {t('startCollectingObservations')}</li>
                </ul>
              </div>
              
              <Button 
                onClick={completeOnboarding} 
                disabled={isLoading}
                className="w-full max-w-sm"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground" />
                    {t('settingUp')}
                  </>
                ) : (
                  <>
                    {t('goToDashboard')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    return true; // All steps are informational, no validation needed
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  // Filter steps based on user's situation
  const getVisibleSteps = () => {
    if (hasExistingSites) {
      return ONBOARDING_STEPS; // Show all steps including 'existing-team'
    } else {
      return ONBOARDING_STEPS.filter(step => step.id !== 'existing-team'); // Skip 'existing-team' step
    }
  };

  const visibleSteps = getVisibleSteps();
  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">{t("setupYourSite")}</h1>
            <span className="text-sm text-muted-foreground">
              {t("step")} {currentStep + 1} {t("of")} {visibleSteps.length}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Main Content */}
        <Card className="mb-8 border-border bg-card text-card-foreground shadow-sm">
          <CardContent className="pt-6">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation — hide on final step (uses inline CTA) */}
        {currentStep < visibleSteps.length - 1 && (
          <div className="space-y-4">
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t("previous")}
              </Button>

              <Button onClick={nextStep} disabled={!canProceed()}>
                {t("next")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}