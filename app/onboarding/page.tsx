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
                className="w-20 h-20 border border-gray-300 rounded"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t('welcomeToSimpleSite')}</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                {t('welcomeDescription')}
              </p>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-black">{t('whatYouCanDo')}</h3>
                <ul className="text-sm text-black space-y-1">
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
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t('youreAlreadyPartOfATeam')}</h2>
              <p className="text-gray-600">{t('foundExistingCollaborations')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm text-green-800 mb-3">
                  {t('skipIntroductionAndStart')}
                </p>
                <Button 
                  onClick={completeOnboarding}
                  variant="outline"
                  className="border-green-300 text-green-800 hover:bg-green-100 w-full"
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
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t('sites')}</h2>
              <p className="text-gray-600">{t('siteIsLocation')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold text-black mb-2">{t('whatYouCanDo')}</h3>
                <ul className="text-sm text-black space-y-1">
                  <li>• {t('createMultipleObservationSites')}</li>
                  <li>• {t('addDescriptionsAndDetails')}</li>
                  <li>• {t('manageSiteCollaborators')}</li>
                  <li>• {t('uploadSitePlansAndReference')}</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
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
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Tag className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t('observationLabels')}</h2>
              <p className="text-gray-600">{t('labelsHelpCategorize')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold text-black mb-2">{t('whatYouCanDo')}</h3>
                <ul className="text-sm text-black space-y-1">
                  <li>• {t('createHierarchicalLabelSystems')}</li>
                  <li>• {t('organizeLabelsByLocation')}</li>
                  <li>• {t('useLabelsToFilter')}</li>
                  <li>• {t('shareLabelsAcrossTeam')}</li>
                </ul>
              </div>
              
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm text-black">
                  <strong>{t('commonLabelExamples')}</strong> {t('issueProgressCompleted')}
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
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
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t('sitePlans')}</h2>
              <p className="text-gray-600">{t('uploadFloorPlansOrSiteMaps')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold text-black mb-2">{t('whatYouCanDo')}</h3>
                <ul className="text-sm text-black space-y-1">
                  <li>• {t('uploadFloorPlansSiteMaps')}</li>
                  <li>• {t('supportForImages')}</li>
                  <li>• {t('pinObservationsDirectly')}</li>
                  <li>• {t('shareVisualContext')}</li>
                </ul>
              </div>
              
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm text-black">
                  {t('plansHelpTeamMembers')}
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
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
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t('teamCollaboration')}</h2>
              <p className="text-gray-600">{t('addTeamMembersToCollaborate')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold text-black mb-2">{t('whatYouCanDo')}</h3>
                <ul className="text-sm text-black space-y-1">
                  <li>• {t('inviteTeamMembersViaEmail')}</li>
                  <li>• {t('setDifferentPermissionLevels')}</li>
                  <li>• {t('viewTeamObservationsRealTime')}</li>
                  <li>• {t('manageCollaboratorAccess')}</li>
                </ul>
              </div>
              
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm text-black">
                  {t('teamMembersWillReceive')}
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
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
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t('getTheMobileApp')}</h2>
              <p className="text-gray-600">{t('essentialForCollecting')}</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-lg">
                <h3 className="font-semibold mb-3 text-black">{t('simpleSiteMobileApp')}</h3>
                <ul className="text-sm space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-black" />
                    {t('takePhotosAndAddNotes')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-black" />
                    {t('gpsLocationTracking')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-black" />
                    {t('automaticSyncWithSites')}
                  </li>
                </ul>
                
                <div className="flex justify-center">
                  <a 
                    href="https://apps.apple.com/us/app/simple-site/id6749160249"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src="/app_screens/available-app-store_1.png"
                      alt={t('availableOnAppStore')}
                      width={120}
                      height={40}
                      className="w-auto h-auto object-contain"
                    />
                  </a>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">{t('webVsMobile')}</p>
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
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-black" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-black">{t('youreAllSet')}</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                {t('welcomeToSimpleSiteComplete')}
              </p>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-black">{t('whatsNext')}</h3>
                <ul className="text-sm text-black space-y-1">
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-lg font-semibold">{t('setupYourSite')}</h1>
            <span className="text-sm text-gray-500">
              {t('step')} {currentStep + 1} {t('of')} {visibleSteps.length}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Main Content */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < ONBOARDING_STEPS.length - 1 && (
          <div className="space-y-4">
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t('previous')}
              </Button>
              
              <Button 
                onClick={nextStep}
                disabled={!canProceed()}
              >
                {t('next')}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}