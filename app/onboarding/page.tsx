"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle,
  Plus,
  X
} from "lucide-react";
import Image from "next/image";

interface OnboardingData {
  siteName: string;
  siteDescription: string;
  labels: string[];
  inviteEmails: string[];
  planFile: File | null;
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Simple Site',
    description: 'Your platform for collaborative site observations',
    icon: Globe
  },
  {
    id: 'create-site',
    title: 'Create Your First Site',
    description: 'Set up a site where you and your team can make observations',
    icon: MapPin
  },
  {
    id: 'add-labels',
    title: 'Add Observation Labels',
    description: 'Create labels to categorize your observations',
    icon: Tag
  },
  {
    id: 'upload-plan',
    title: 'Upload Site Plan (Optional)',
    description: 'Upload a floor plan or site map for reference',
    icon: Upload
  },
  {
    id: 'invite-team',
    title: 'Invite Your Team',
    description: 'Add collaborators to work together on observations',
    icon: Users
  },
  {
    id: 'mobile-app',
    title: 'Get the Mobile App',
    description: 'Download the app to collect observations in the field',
    icon: Smartphone
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
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    siteName: '',
    siteDescription: '',
    labels: [],
    inviteEmails: [],
    planFile: null
  });
  const [tempLabel, setTempLabel] = useState('');
  const [tempEmail, setTempEmail] = useState('');

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
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
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

  const addLabel = () => {
    if (tempLabel.trim() && !onboardingData.labels.includes(tempLabel.trim())) {
      setOnboardingData(prev => ({
        ...prev,
        labels: [...prev.labels, tempLabel.trim()]
      }));
      setTempLabel('');
    }
  };

  const removeLabel = (label: string) => {
    setOnboardingData(prev => ({
      ...prev,
      labels: prev.labels.filter(l => l !== label)
    }));
  };

  const addEmail = () => {
    const email = tempEmail.trim().toLowerCase();
    if (email && email.includes('@') && !onboardingData.inviteEmails.includes(email)) {
      setOnboardingData(prev => ({
        ...prev,
        inviteEmails: [...prev.inviteEmails, email]
      }));
      setTempEmail('');
    }
  };

  const removeEmail = (email: string) => {
    setOnboardingData(prev => ({
      ...prev,
      inviteEmails: prev.inviteEmails.filter(e => e !== email)
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOnboardingData(prev => ({ ...prev, planFile: file }));
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let siteData = null;

      // Only create site if user provided a site name
      if (onboardingData.siteName.trim()) {
        const { data: newSiteData, error: siteError } = await supabase
          .from('sites')
          .insert({
            name: onboardingData.siteName,
            description: onboardingData.siteDescription,
            user_id: user.id
          })
          .select()
          .single();

        if (siteError) throw siteError;
        siteData = newSiteData;

        // Add user as owner of the site
        await supabase
          .from('site_collaborators')
          .insert({
            site_id: siteData.id,
            user_id: user.id,
            role: 'owner',
            status: 'accepted'
          });

        // Upload plan file if provided
        if (onboardingData.planFile) {
          try {
            const fileExt = onboardingData.planFile.name.split('.').pop();
            const fileName = `${siteData.id}/plan.${fileExt}`;
            
            // Try to upload to plans bucket, create if it doesn't exist
            const { error: uploadError } = await supabase.storage
              .from('plans')
              .upload(fileName, onboardingData.planFile);

            if (uploadError) {
              console.error('Plan upload error:', uploadError);
              // Try photos bucket as fallback
              const { error: fallbackError } = await supabase.storage
                .from('photos')
                .upload(`plans/${fileName}`, onboardingData.planFile);
              
              if (!fallbackError) {
                await supabase
                  .from('sites')
                  .update({ plan_url: `plans/${fileName}` })
                  .eq('id', siteData.id);
                console.log('Plan uploaded to photos bucket as fallback');
              } else {
                console.error('Fallback plan upload failed:', fallbackError);
              }
            } else {
              await supabase
                .from('sites')
                .update({ plan_url: fileName })
                .eq('id', siteData.id);
              console.log('Plan uploaded successfully');
            }
          } catch (planError) {
            console.error('Plan upload process failed:', planError);
          }
        }

        // Save labels as site metadata if provided
        if (onboardingData.labels.length > 0) {
          try {
            await supabase
              .from('sites')
              .update({ 
                labels: onboardingData.labels 
              })
              .eq('id', siteData.id);
            console.log('Site labels saved:', onboardingData.labels);
          } catch (labelsError) {
            console.error('Failed to save labels:', labelsError);
          }
        }

        // Send invitations if site was created
        if (onboardingData.inviteEmails.length > 0) {
          const { inviteUserToSite } = await import('@/lib/supabase/api');
          
          for (const email of onboardingData.inviteEmails) {
            try {
              await inviteUserToSite(siteData.id, email, user.id, 'collaborator');
            } catch (error) {
              console.error(`Failed to invite ${email}:`, error);
            }
          }
        }
      }

      // Mark onboarding as complete
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
      console.error('Error completing onboarding:', error);
      alert('There was an error setting up your site. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = ONBOARDING_STEPS[currentStep];

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
              <h2 className="text-2xl font-bold">Welcome to Simple Site!</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Simple Site is a collaborative platform for collecting and managing site observations. 
                Perfect for teams conducting site visits, inspections, or research.
              </p>
              
              {hasExistingSites && (
                <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">You&apos;re already part of a team!</h3>
                  <p className="text-sm text-black mb-3">
                    We found that you&apos;ve been invited to collaborate on existing sites. 
                    You can skip this setup and start using Simple Site right away.
                  </p>
                  <Button 
                    onClick={skipOnboarding}
                    variant="outline"
                    className="border-gray-300 text-black hover:bg-gray-200"
                  >
                    Go to My Sites
                  </Button>
                </div>
              )}
              
              <div className="bg-gray-100 p-4 rounded-lg">
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

      case 'create-site':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">Create Your First Site</h2>
              <p className="text-gray-600">A site is a location where you&apos;ll collect observations</p>
            </div>
            
            {hasExistingSites && (
              <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg">
                <p className="text-sm text-black">
                  Since you&apos;re already part of existing sites, creating a new site is optional. 
                  You can skip this step and work with your existing teams.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="siteName">Site Name {!hasExistingSites && '*'}</Label>
                <Input
                  id="siteName"
                  placeholder="e.g., Building A, Research Plot 1, Main Office"
                  value={onboardingData.siteName}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, siteName: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="siteDescription">Description (Optional)</Label>
                <Textarea
                  id="siteDescription"
                  placeholder="Brief description of your site..."
                  value={onboardingData.siteDescription}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, siteDescription: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 'add-labels':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Tag className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">Add Observation Labels</h2>
              <p className="text-gray-600">Labels help categorize and organize your observations</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Issue, Progress, Completed"
                  value={tempLabel}
                  onChange={(e) => setTempLabel(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLabel()}
                />
                <Button onClick={addLabel} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {onboardingData.labels.length > 0 && (
                <div className="space-y-2">
                  <Label>Your Labels:</Label>
                  <div className="flex flex-wrap gap-2">
                    {onboardingData.labels.map((label) => (
                      <Badge key={label} variant="outline" className="flex items-center gap-1">
                        {label}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeLabel(label)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm text-black">
                  Tip: Common labels include &quot;Issue&quot;, &quot;Progress&quot;, &quot;Completed&quot;, &quot;Damage&quot;, &quot;Repair Needed&quot;
                </p>
              </div>
            </div>
          </div>
        );

      case 'upload-plan':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">Upload Site Plan</h2>
              <p className="text-gray-600">Optional: Upload a floor plan or site map for reference</p>
            </div>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="planFile"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="planFile" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload a plan file</p>
                  <p className="text-sm text-gray-400">Supports images (PNG, JPG) and PDF files</p>
                </label>
              </div>
              
              {onboardingData.planFile && (
                <div className="bg-gray-100 p-3 rounded-lg flex items-center gap-2">
                  <Check className="h-4 w-4 text-black" />
                  <span className="text-sm text-black">File selected: {onboardingData.planFile.name}</span>
                </div>
              )}
              
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm text-black">
                  Plans help team members understand the site layout and locate observations more easily.
                </p>
              </div>
            </div>
          </div>
        );

      case 'invite-team':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">Invite Your Team</h2>
              <p className="text-gray-600">Add team members to collaborate on observations</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                />
                <Button onClick={addEmail} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {onboardingData.inviteEmails.length > 0 && (
                <div className="space-y-2">
                  <Label>Invitations to send:</Label>
                  <div className="space-y-2">
                    {onboardingData.inviteEmails.map((email) => (
                      <div key={email} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{email}</span>
                        <X 
                          className="h-4 w-4 cursor-pointer text-gray-500 hover:text-red-500" 
                          onClick={() => removeEmail(email)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm text-black">
                  Team members will receive email invitations to join your site as collaborators.
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
              <h2 className="text-xl font-bold mb-2">Get the Mobile App</h2>
              <p className="text-gray-600">Collect observations in the field with our mobile app</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-lg">
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
                    Offline mode for remote locations
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
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-black text-center">
                  You can also use the web version, but the mobile app provides the best field experience
                </p>
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
              <h2 className="text-2xl font-bold text-black">You&apos;re All Set!</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Your site &quot;{onboardingData.siteName}&quot; has been created successfully. 
                You can now start collecting observations with your team.
              </p>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-black">What&apos;s next:</h3>
                <ul className="text-sm text-black space-y-1">
                  <li>• Start creating observations on your site</li>
                  <li>• Download the mobile app for field work</li>
                  <li>• Invite more team members if needed</li>
                  <li>• Explore reporting and export features</li>
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
    const step = ONBOARDING_STEPS[currentStep];
    switch (step.id) {
      case 'create-site':
        // If user has existing sites, site creation is optional
        return hasExistingSites || onboardingData.siteName.trim().length > 0;
      default:
        return true;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-lg font-semibold">Setup Your Site</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
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