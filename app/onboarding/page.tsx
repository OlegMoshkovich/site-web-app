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

  const skipOnboarding = async () => {
    if (!user) return;
    
    try {
      // Mark onboarding as complete without creating anything
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          onboarding_completed: true
        });

      // Redirect to main app
      router.push('/');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const skipCurrentStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      nextStep();
    } else {
      // If last step, complete onboarding
      skipOnboarding();
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
                className="w-20 h-20 border border-gray-300 "
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Welcome to Simple Site!</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Simple Site is a collaborative platform for collecting and managing site observations. 
                Perfect for teams conducting site visits, inspections, or research.
              </p>
              
              <div className="bg-gray-100 p-4 -lg">
                <h3 className="font-semibold mb-2 text-black">What you can do:</h3>
                <ul className="text-sm text-black space-y-1">
                  <li>• Create and manage observation sites</li>
                  <li>• Collaborate with team members</li>
                  <li>• Collect observations with photos and notes</li>
                  <li>• Generate reports and export data</li>
                  <li>• Use our mobile app for field work</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'existing-team':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 -full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">You&apos;re already part of a team!</h2>
              <p className="text-gray-600">We found that you&apos;ve been invited to collaborate on existing sites</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 -lg">
                <p className="text-sm text-green-800 mb-3">
                  You can skip this introduction and start using Simple Site right away, or continue to learn about the platform&apos;s features.
                </p>
                <Button 
                  onClick={skipOnboarding}
                  variant="outline"
                  className="border-green-300 text-green-800 hover:bg-green-100 w-full"
                >
                  Go to My Sites
                </Button>
              </div>
              
            </div>
          </div>
        );

      case 'about-sites':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 -full flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">Sites</h2>
              <p className="text-gray-600">A site is a location where you&apos;ll collect observations</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 -lg">
                <h3 className="font-semibold text-black mb-2">What you can do:</h3>
                <ul className="text-sm text-black space-y-1">
                  <li>• Create multiple observation sites</li>
                  <li>• Add descriptions and details for each site</li>
                  <li>• Manage site collaborators and permissions</li>
                  <li>• Upload site plans and reference materials</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 -lg">
                <p className="text-sm text-blue-800">
                  <strong>To create sites:</strong> Go to Settings → Site Management after completing this introduction
                </p>
              </div>
            </div>
          </div>
        );

      case 'about-labels':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 -full flex items-center justify-center mb-4">
                <Tag className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">Observation Labels</h2>
              <p className="text-gray-600">Labels help categorize and organize your observations</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 -lg">
                <h3 className="font-semibold text-black mb-2">What you can do:</h3>
                <ul className="text-sm text-black space-y-1">
                  <li>• Create hierarchical label systems</li>
                  <li>• Organize labels by location, type, or category</li>
                  <li>• Use labels to filter and search observations</li>
                  <li>• Share labels across team members</li>
                </ul>
              </div>
              
              <div className="bg-gray-100 p-3 -lg">
                <p className="text-sm text-black">
                  <strong>Common label examples:</strong> Issue, Progress, Completed, Damage, Repair Needed, Quality Check
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 -lg">
                <p className="text-sm text-blue-800">
                  <strong>To create labels:</strong> Go to Settings → Label Management after completing this introduction
                </p>
              </div>
            </div>
          </div>
        );

      case 'about-plans':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 -full flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">Site Plans</h2>
              <p className="text-gray-600">Upload floor plans or site maps for reference</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 -lg">
                <h3 className="font-semibold text-black mb-2">What you can do:</h3>
                <ul className="text-sm text-black space-y-1">
                  <li>• Upload floor plans, site maps, or diagrams</li>
                  <li>• Support for images (PNG, JPG)</li>
                  <li>• Pin observations directly to plan locations</li>
                  <li>• Share visual context with team members</li>
                </ul>
              </div>
              
              <div className="bg-gray-100 p-3 -lg">
                <p className="text-sm text-black">
                  Plans help team members understand the site layout and locate observations more easily.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 -lg">
                <p className="text-sm text-blue-800">
                  <strong>To upload plans:</strong> Go to Settings → Plan Management after completing this introduction
                </p>
              </div>
            </div>
          </div>
        );

      case 'about-collaboration':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 -full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">Team Collaboration</h2>
              <p className="text-gray-600">Add team members to collaborate on observations</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 -lg">
                <h3 className="font-semibold text-black mb-2">What you can do:</h3>
                <ul className="text-sm text-black space-y-1">
                  <li>• Invite team members via email</li>
                  <li>• Set different permission levels (Admin, Collaborator)</li>
                  <li>• View team observations in real-time</li>
                  <li>• Manage collaborator access and roles</li>
                </ul>
              </div>
              
              <div className="bg-gray-100 p-3 -lg">
                <p className="text-sm text-black">
                  Team members will receive email invitations to join your site as collaborators and can start contributing observations immediately.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 -lg">
                <p className="text-sm text-blue-800">
                  <strong>To invite team members:</strong> Go to Settings → Collaboration Management after completing this introduction
                </p>
              </div>
            </div>
          </div>
        );

      case 'mobile-app':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 -full flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">Get the Mobile App</h2>
              <p className="text-gray-600">Essential for collecting observations in the field</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 -lg">
                <h3 className="font-semibold mb-3 text-black">Simple Site Mobile App</h3>
                <ul className="text-sm space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-black" />
                    Take photos and add notes on-site
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-black" />
                    GPS location tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-black" />
                    Automatic sync with your sites
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
                      src="/app_screens/available-app-store.png"
                      alt="Available on the App Store"
                      width={120}
                      height={40}
                      className="w-auto h-auto object-contain"
                    />
                  </a>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 -lg">
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">Web vs Mobile:</p>
                  <ul className="space-y-1">
                    <li>• <strong>Web Portal:</strong> View team observations, generate reports, and manage settings</li>
                    <li>• <strong>Mobile App:</strong> Required for collecting observations in the field</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gray-100 -full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-black" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-black">You&apos;re All Set!</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Welcome to Simple Site! You now know how to use all the key features. 
                You can start by creating your first site and observations.
              </p>
              
              <div className="bg-gray-100 p-4 -lg">
                <h3 className="font-semibold mb-2 text-black">What&apos;s next:</h3>
                <ul className="text-sm text-black space-y-1">
                  <li>• Go to Settings to create your first site</li>
                  <li>• Set up observation labels and upload plans</li>
                  <li>• Invite team members to collaborate</li>
                  <li>• Download the mobile app for field work</li>
                  <li>• Start collecting observations</li>
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
                    <div className="animate-spin -full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    Go to Dashboard
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
        <div className="animate-spin -full h-8 w-8 border-b-2 border-primary"></div>
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
            <h1 className="text-lg font-semibold">Setup Your Site</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {visibleSteps.length}
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
                Previous
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  onClick={skipCurrentStep}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Skip
                </Button>
                <Button 
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={skipOnboarding}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Skip entire setup - I&apos;ll do this later
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}