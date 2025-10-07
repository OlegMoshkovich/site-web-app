"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Users, Tags, MapPin, Trash2, Settings, Upload, FileImage } from "lucide-react";
import { Language, useTranslations } from "@/lib/translations";
import { AuthButtonClient } from "@/components/auth-button-client";
import { inviteUserToSite, getSitePendingInvitations, removeCollaborator, getPendingInvitationsForUser, updateCollaboratorRole } from "@/lib/supabase/api";
import type { SiteCollaborator, CollaborationInvitation } from "@/types/supabase";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('de'); // Default to German
  const t = useTranslations(language);

  // Site management state
  const [sites, setSites] = useState<{name: string; id: string; description?: string | null}[]>([]);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteDescription, setNewSiteDescription] = useState("");

  // Label management state
  const [labels, setLabels] = useState<{name: string; id: string; description?: string | null; category: string; parent_id?: string | null}[]>([]);
  const [selectedSiteForLabels, setSelectedSiteForLabels] = useState<string>("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelDescription, setNewLabelDescription] = useState("");
  const [newLabelCategory, setNewLabelCategory] = useState<"location" | "gewerk" | "type">("location");
  const [newLabelParent, setNewLabelParent] = useState<string>("");

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedSiteForInvite, setSelectedSiteForInvite] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "collaborator">("collaborator");

  // Plan upload state
  const [selectedSiteForPlans, setSelectedSiteForPlans] = useState<string>("");
  const [plans, setPlans] = useState<{id: string; plan_name: string; plan_url: string; site_id: string}[]>([]);
  const [newPlanName, setNewPlanName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Collaboration state
  const [selectedSiteForCollaborators, setSelectedSiteForCollaborators] = useState<string>("");
  const [collaborators, setCollaborators] = useState<(SiteCollaborator & { email?: string })[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<CollaborationInvitation[]>([]);
  
  // User pending invitations state
  const [userPendingInvitations, setUserPendingInvitations] = useState<(CollaborationInvitation & { site_name?: string })[]>([]);


  const loadSites = useCallback(async () => {
    if (!user) return;
    
    try {
      // Query the actual sites table for this user
      const { data: sites, error } = await supabase
        .from('sites')
        .select('id, name, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading sites:', error);
        return;
      }
      
      console.log('User sites loaded:', sites);
      
      // Transform to the expected format
      const siteObjects = (sites || []).map((site: {id: string; name: string; description?: string | null}) => ({ 
        name: site.name, 
        id: site.id,
        description: site.description 
      }));
      setSites(siteObjects);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  }, [user, supabase]);

  const loadLabels = useCallback(async (siteId?: string) => {
    if (!user) return;
    
    try {
      const query = supabase
        .from('labels')
        .select('id, name, description, category, parent_id, order_index')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('category')
        .order('order_index');
      
      // If a specific site is selected, filter by site
      if (siteId) {
        query.eq('site_id', siteId);
      }
      
      const { data: labelsData, error } = await query;
      
      if (error) {
        console.error('Error loading labels:', error);
        return;
      }
      
      // Transform to the expected format
      const labelObjects = (labelsData || []).map((label: {
        id: string; 
        name: string; 
        description?: string | null;
        category: string;
        parent_id?: string | null;
      }) => ({
        name: label.name,
        id: label.id,
        description: label.description,
        category: label.category,
        parent_id: label.parent_id
      }));
      
      setLabels(labelObjects);
      console.log('Labels loaded for site:', siteId, labelObjects);
    } catch (error) {
      console.error('Error loading labels:', error);
    }
  }, [user, supabase]);

  const loadPlans = useCallback(async (siteId?: string) => {
    if (!user) return;
    
    try {
      const query = supabase
        .from('site_plans')
        .select('id, plan_name, plan_url, site_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (siteId) {
        query.eq('site_id', siteId);
      }
      
      const { data: plansData, error } = await query;
      
      if (error) {
        console.error('Error loading plans:', error);
        return;
      }
      
      // Generate fresh signed URLs for each plan
      const plansWithFreshUrls = await Promise.all(
        (plansData || []).map(async (plan: {id: string; plan_name: string; plan_url: string; site_id: string}) => {
          try {
            // Extract file path from existing URL or construct it
            const fileName = plan.plan_url.split('/').pop()?.split('?')[0];
            const filePath = `${plan.site_id}/${fileName}`;
            
            const { data: urlData, error: urlError } = await supabase.storage
              .from('plans')
              .createSignedUrl(filePath, 60 * 60 * 24 * 365);
            
            if (urlError) {
              console.error('Error creating signed URL for plan:', plan.id, urlError);
              return plan; // Return original if URL generation fails
            }
            
            return {
              ...plan,
              plan_url: urlData.signedUrl
            };
          } catch (error) {
            console.error('Error processing plan URL:', plan.id, error);
            return plan;
          }
        })
      );
      
      setPlans(plansWithFreshUrls);
      console.log('Plans loaded for site:', siteId, plansWithFreshUrls);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  }, [user, supabase]);

  const loadCollaborators = useCallback(async (siteId?: string) => {
    if (!user || !siteId) return;
    
    try {
      // Get collaborators first
      const { data: collaboratorsData, error: collabError } = await supabase
        .from('site_collaborators')
        .select('*')
        .eq('site_id', siteId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: true });

      if (collabError) {
        console.error('Error loading collaborators:', collabError);
        return;
      }

      // Then get user emails separately
      const collaboratorsWithEmail = await Promise.all(
        (collaboratorsData || []).map(async (collab: SiteCollaborator) => {
          let email = 'Unknown';
          
          console.log('Looking up email for user:', collab.user_id);
          
          // Try to get from profiles table
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', collab.user_id)
              .single();
            
            console.log('Profile lookup result:', { profileData, profileError });
            
            if (profileData?.email) {
              email = profileData.email;
            } else if (profileError) {
              console.error('Profile error:', profileError);
            }
          } catch (profileError) {
            console.error('Profile lookup failed for user:', collab.user_id, profileError);
          }

          // If still unknown, try to get from invitation records (as a fallback)
          if (email === 'Unknown') {
            try {
              const { data: inviteData } = await supabase
                .from('collaboration_invitations')
                .select('invited_email')
                .eq('site_id', siteId)
                .eq('status', 'accepted')
                .limit(1);
              
              // This is a weak match - only use if there's exactly one accepted invitation
              if (inviteData && inviteData.length === 1) {
                email = inviteData[0].invited_email;
                console.log('Using email from invitation record:', email);
              }
            } catch (inviteError) {
              console.log('Invitation lookup failed:', inviteError);
            }
          }

          return {
            ...collab,
            email: email
          };
        })
      );

      setCollaborators(collaboratorsWithEmail);

      // Get pending invitations
      const pendingData = await getSitePendingInvitations(siteId);
      setPendingInvitations(pendingData);
      
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  }, [user, supabase]);

  const loadUserPendingInvitations = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      const invitations = await getPendingInvitationsForUser(user.email);
      setUserPendingInvitations(invitations);
    } catch (error) {
      console.error('Error loading user pending invitations:', error);
    }
  }, [user?.email]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error || !authData.user) {
        router.push('/');
        return;
      }
      setUser(authData.user);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, supabase.auth]);

  useEffect(() => {
    if (user) {
      // Load user's sites when user is available
      loadSites();
      // Load user's pending invitations
      loadUserPendingInvitations();
    }
  }, [user, loadSites, loadUserPendingInvitations]);

  useEffect(() => {
    if (selectedSiteForLabels) {
      // Load labels when a site is selected
      loadLabels(selectedSiteForLabels);
    }
  }, [selectedSiteForLabels, loadLabels]);

  useEffect(() => {
    if (selectedSiteForPlans) {
      // Load plans when a site is selected
      loadPlans(selectedSiteForPlans);
    }
  }, [selectedSiteForPlans, loadPlans]);

  useEffect(() => {
    if (selectedSiteForCollaborators) {
      // Load collaborators when a site is selected
      loadCollaborators(selectedSiteForCollaborators);
    }
  }, [selectedSiteForCollaborators, loadCollaborators]);

  const handleCreateSite = async () => {
    if (!newSiteName.trim() || !user) return;
    
    try {
      // Insert into the sites table
      const { data: newSite, error } = await supabase
        .from('sites')
        .insert({
          user_id: user.id,
          name: newSiteName.trim(),
          description: newSiteDescription.trim() || null
        })
        .select('id, name, description')
        .single();
      
      if (error) {
        console.error('Error creating site:', error);
        alert('Failed to create site. Please try again.');
        return;
      }
      
      // Add to local state
      if (newSite) {
        setSites(prev => [{ 
          name: newSite.name, 
          id: newSite.id,
          description: newSite.description 
        }, ...prev]);
      }
      
      setNewSiteName("");
      setNewSiteDescription("");
      
      // Show success message
      alert(`Site "${newSiteName}" created successfully!`);
    } catch (error) {
      console.error('Error creating site:', error);
      alert('Failed to create site. Please try again.');
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !user || !selectedSiteForLabels) {
      alert('Please select a site and enter a label name.');
      return;
    }
    
    try {
      const { data: newLabel, error } = await supabase
        .from('labels')
        .insert({
          user_id: user.id,
          site_id: selectedSiteForLabels,
          name: newLabelName.trim(),
          description: newLabelDescription.trim() || null,
          category: newLabelCategory,
          parent_id: newLabelParent || null
        })
        .select('id, name, description, category, parent_id')
        .single();
      
      if (error) {
        console.error('Error creating label:', error);
        alert('Failed to create label. Please try again.');
        return;
      }
      
      if (newLabel) {
        // Successfully created in database
        setLabels(prev => [{ 
          name: newLabel.name, 
          id: newLabel.id,
          description: newLabel.description,
          category: newLabel.category,
          parent_id: newLabel.parent_id
        }, ...prev]);
      }
      
      setNewLabelName("");
      setNewLabelDescription("");
      setNewLabelParent("");
      
      // Show success message
      alert(`Label "${newLabelName}" created successfully!`);
    } catch (error) {
      console.error('Error creating label:', error);
      alert('Failed to create label. Please try again.');
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !selectedSiteForInvite || !user) {
      alert('Please select a site and enter an email address.');
      return;
    }

    try {
      await inviteUserToSite(selectedSiteForInvite, inviteEmail.trim(), user.id, inviteRole);
      
      alert(`Invitation sent to ${inviteEmail} as ${inviteRole} for the selected site!`);
      setInviteEmail("");
      setSelectedSiteForInvite("");
      setInviteRole("collaborator");
    } catch (error: unknown) {
      console.error('Error sending invitation:', error);
      alert((error as Error)?.message || 'Failed to send invitation. Please try again.');
    }
  };


  const handleDeleteSite = async (siteId: string, siteName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${siteName}"? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', siteId)
        .eq('user_id', user?.id); // Extra safety check
      
      if (error) {
        console.error('Error deleting site:', error);
        alert('Failed to delete site. Please try again.');
        return;
      }
      
      // Remove from local state
      setSites(prev => prev.filter(site => site.id !== siteId));
      
      alert(`Site "${siteName}" deleted successfully.`);
    } catch (error) {
      console.error('Error deleting site:', error);
      alert('Failed to delete site. Please try again.');
    }
  };

  const handleDeleteLabel = async (labelId: string, labelName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${labelName}"? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      // Try to delete from labels table if it exists
      const { error } = await supabase
        .from('labels')
        .delete()
        .eq('id', labelId)
        .eq('user_id', user?.id); // Extra safety check
      
      if (error) {
        console.log('Labels table may not exist or other error:', error);
      }
      
      // Remove from local state regardless
      setLabels(prev => prev.filter(label => label.id !== labelId));
      
      alert(`Label "${labelName}" deleted successfully.`);
    } catch (error) {
      console.error('Error deleting label:', error);
      // Still remove from local state
      setLabels(prev => prev.filter(label => label.id !== labelId));
      alert(`Label "${labelName}" removed locally.`);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadPlan = async () => {
    if (!selectedFile || !newPlanName.trim() || !selectedSiteForPlans || !user) {
      alert('Please select a site, enter a plan name, and choose a file.');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      const fileName = `plan_${Date.now()}.${fileExt}`;
      const filePath = `${selectedSiteForPlans}/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('plans')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload file. Please try again.');
        return;
      }

      // Get signed URL for the uploaded file (expires in 1 year)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('plans')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (urlError) {
        console.error('Error creating signed URL:', urlError);
        alert('Failed to create access URL for the plan. Please try again.');
        return;
      }

      // Save plan metadata to database
      const { data: planData, error: dbError } = await supabase
        .from('site_plans')
        .insert({
          user_id: user.id,
          site_id: selectedSiteForPlans,
          plan_name: newPlanName.trim(),
          plan_url: urlData.signedUrl
        })
        .select('id, plan_name, plan_url, site_id')
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        alert('Failed to save plan information. Please try again.');
        return;
      }

      // Add to local state
      if (planData) {
        setPlans(prev => [planData, ...prev]);
      }

      // Reset form
      setNewPlanName("");
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('planFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      alert(`Plan "${newPlanName}" uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading plan:', error);
      alert('Failed to upload plan. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${planName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('site_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting plan:', error);
        alert('Failed to delete plan. Please try again.');
        return;
      }

      // Remove from local state
      setPlans(prev => prev.filter(plan => plan.id !== planId));
      
      alert(`Plan "${planName}" deleted successfully.`);
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan. Please try again.');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string, email: string) => {
    const confirmed = window.confirm(`Remove ${email} from this site? They will lose access immediately.`);
    if (!confirmed) return;

    try {
      await removeCollaborator(selectedSiteForCollaborators, collaboratorId);
      
      // Refresh collaborators list
      loadCollaborators(selectedSiteForCollaborators);
      
      alert(`${email} has been removed from the site.`);
    } catch (error) {
      console.error('Error removing collaborator:', error);
      alert('Failed to remove collaborator. Please try again.');
    }
  };

  const handleUpdateCollaboratorRole = async (
    collaboratorId: string, 
    email: string, 
    currentRole: string, 
    newRole: 'admin' | 'collaborator'
  ) => {
    const roleNames = {
      admin: 'Admin (can see all observations)',
      collaborator: 'Collaborator (own observations only)'
    };
    
    const confirmed = window.confirm(
      `Change ${email}'s role from ${currentRole} to ${newRole}?\n\n` +
      `New permissions: ${roleNames[newRole]}`
    );
    if (!confirmed) return;

    try {
      await updateCollaboratorRole(selectedSiteForCollaborators, collaboratorId, newRole);
      
      // Refresh collaborators list
      loadCollaborators(selectedSiteForCollaborators);
      
      alert(`${email}'s role has been updated to ${newRole}.`);
    } catch (error) {
      console.error('Error updating collaborator role:', error);
      alert('Failed to update collaborator role. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-4 items-center">
        {/* Top navigation bar with site title, language selector, and auth */}
        <nav className="sticky top-0 z-20 w-full flex justify-center h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="w-full max-w-5xl flex justify-between items-center px-3 sm:px-5 text-sm">
            <div className="flex text-lg gap-5 items-center font-semibold">
              {t("siteTitle")}
            </div>
            <div className="flex items-center gap-2">
              {/* Language selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="h-8 w-8 px-0 text-sm border border-gray-300 bg-white focus:outline-none focus:border-gray-400 cursor-pointer text-center"
                style={{ 
                  textAlignLast: "center",
                  backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                  backgroundSize: "8px 8px",
                  backgroundPosition: "calc(100% - 2px) center",
                  backgroundRepeat: "no-repeat",
                  appearance: "none"
                }}
              >
                <option value="en">EN</option>
                <option value="de">DE</option>
              </select>

              {/* Settings gear icon */}
              {user && (
                <Button
                  onClick={() => router.push('/settings')}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center bg-gray-200 text-gray-700"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}

              <AuthButtonClient />
            </div>
          </div>
        </nav>

        {/* Main content area with responsive padding */}
        <div className="flex-1 flex flex-col gap-0 max-w-5xl px-3 sm:px-5 py-14 sm:py-3 md:py-4">
          <div className="w-full">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('back')}
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">{t('settings')}</h1>
            </div>

            {/* Pending Invitations Alert */}
            {userPendingInvitations.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Users className="h-5 w-5" />
                    Pending Collaboration Invitations
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    You have been invited to collaborate on the following sites:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {userPendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-md">
                      <div>
                        <div className="font-medium text-gray-900">
                          {invitation.site_name}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          Role: {invitation.role} • Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        onClick={() => router.push(`/invitations/${invitation.token}`)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Accept Invitation
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
          {/* Site Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('siteManagement')}
              </CardTitle>
              <CardDescription>
                {t('createAndManageObservationSites')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">{t('siteName')}</Label>
                <Input
                  id="siteName"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder={t('enterSiteName')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">{t('descriptionOptional')}</Label>
                <Textarea
                  id="siteDescription"
                  value={newSiteDescription}
                  onChange={(e) => setNewSiteDescription(e.target.value)}
                  placeholder={t('enterSiteDescription')}
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateSite} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t('createSite')}
              </Button>

              {/* Existing sites */}
              {sites.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('existingSites')}</Label>
                  <div className="space-y-2">
                    {sites.map((site, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span>{site.name}</span>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteSite(site.id, site.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Invitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('invitePeople')}
              </CardTitle>
              <CardDescription>
                {t('inviteUsersToCollaborate')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Site Selection for Invitations */}
              <div className="space-y-2">
                <Label htmlFor="siteSelectInvite">{t('selectSite')}</Label>
                <select
                  id="siteSelectInvite"
                  value={selectedSiteForInvite}
                  onChange={(e) => setSelectedSiteForInvite(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 bg-white"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                    backgroundSize: "12px 12px",
                    backgroundPosition: "calc(100% - 12px) center",
                    backgroundRepeat: "no-repeat",
                    appearance: "none"
                  }}
                >
                  <option value="">{t('chooseASite')}</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteEmail">{t('emailAddress')}</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="inviteRole">Role</Label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "collaborator")}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 bg-white"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                    backgroundSize: "12px 12px",
                    backgroundPosition: "calc(100% - 12px) center",
                    backgroundRepeat: "no-repeat",
                    appearance: "none"
                  }}
                >
                  <option value="collaborator">Collaborator (own observations only)</option>
                  <option value="admin">Admin (see all observations)</option>
                </select>
              </div>

              <Button 
                onClick={handleInviteUser} 
                className="w-full"
                disabled={!selectedSiteForInvite || !inviteEmail.trim()}
              >
                <Users className="h-4 w-4 mr-2" />
                {t('sendInvitation')}
              </Button>
            </CardContent>
          </Card>

          {/* Label Management */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                {t('labelManagement')}
              </CardTitle>
              <CardDescription>
                {t('createAndManageHierarchicalLabels')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Site Selection */}
              <div className="space-y-2">
                <Label htmlFor="siteSelect">{t('selectSite')}</Label>
                <select
                  id="siteSelect"
                  value={selectedSiteForLabels}
                  onChange={(e) => setSelectedSiteForLabels(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 bg-white"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                    backgroundSize: "12px 12px",
                    backgroundPosition: "calc(100% - 12px) center",
                    backgroundRepeat: "no-repeat",
                    appearance: "none"
                  }}
                >
                  <option value="">{t('chooseASite')}</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSiteForLabels && (
                <>
                  {/* Label Creation Form */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">{t('createNewLabel')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="labelName">{t('labelName')}</Label>
                        <Input
                          id="labelName"
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          placeholder={t('enterLabelName')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelCategory">{t('category')}</Label>
                        <select
                          id="labelCategory"
                          value={newLabelCategory}
                          onChange={(e) => setNewLabelCategory(e.target.value as "location" | "gewerk" | "type")}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 bg-white"
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                            backgroundSize: "12px 12px",
                            backgroundPosition: "calc(100% - 12px) center",
                            backgroundRepeat: "no-repeat",
                            appearance: "none"
                          }}
                        >
                          <option value="location">{t('location')}</option>
                          <option value="gewerk">{t('gewerk')}</option>
                          <option value="type">{t('type')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelParent">{t('parentLabelOptional')}</Label>
                        <select
                          id="labelParent"
                          value={newLabelParent}
                          onChange={(e) => setNewLabelParent(e.target.value)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 bg-white"
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                            backgroundSize: "12px 12px",
                            backgroundPosition: "calc(100% - 12px) center",
                            backgroundRepeat: "no-repeat",
                            appearance: "none"
                          }}
                        >
                          <option value="">{t('noParentTopLevel')}</option>
                          {labels
                            .filter(label => label.category === newLabelCategory && !label.parent_id)
                            .map((label) => (
                              <option key={label.id} value={label.id}>
                                {label.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelDescription">{t('descriptionOptional')}</Label>
                        <Textarea
                          id="labelDescription"
                          value={newLabelDescription}
                          onChange={(e) => setNewLabelDescription(e.target.value)}
                          placeholder={t('enterLabelDescription')}
                          rows={2}
                        />
                      </div>
                    </div>
                    <Button onClick={handleCreateLabel} className="w-full mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('createLabel')}
                    </Button>
                  </div>

                  {/* Existing Labels Display */}
                  {labels.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-4">{t('existingLabels')}</h3>
                      {['location', 'gewerk', 'type'].map((category) => {
                        const categoryLabels = labels.filter(label => label.category === category);
                        const topLevelLabels = categoryLabels.filter(label => !label.parent_id);
                        
                        if (topLevelLabels.length === 0) return null;
                        
                        return (
                          <div key={category} className="mb-6">
                            <h4 className="font-medium text-gray-700 mb-2 capitalize">{category}</h4>
                            <div className="space-y-2">
                              {topLevelLabels.map((label) => {
                                const subLabels = categoryLabels.filter(l => l.parent_id === label.id);
                                return (
                                  <div key={label.id} className="border rounded-md p-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="font-medium">{label.name}</span>
                                        {label.description && (
                                          <p className="text-sm text-gray-600 mt-1">{label.description}</p>
                                        )}
                                      </div>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleDeleteLabel(label.id, label.name)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    {subLabels.length > 0 && (
                                      <div className="mt-3 ml-4 border-l-2 border-gray-200 pl-4">
                                        <p className="text-sm font-medium text-gray-500 mb-2">{t('subLabels')}:</p>
                                        {subLabels.map((subLabel) => (
                                          <div key={subLabel.id} className="flex items-center justify-between py-1">
                                            <div>
                                              <span className="text-sm">{subLabel.name}</span>
                                              {subLabel.description && (
                                                <p className="text-xs text-gray-500">{subLabel.description}</p>
                                              )}
                                            </div>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={() => handleDeleteLabel(subLabel.id, subLabel.name)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Plan Upload Management */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                {t('uploadPlans')}
              </CardTitle>
              <CardDescription>
                {t('uploadSitePlansAndMaps')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Site Selection for Plans */}
              <div className="space-y-2">
                <Label htmlFor="siteSelectPlans">{t('selectSite')}</Label>
                <select
                  id="siteSelectPlans"
                  value={selectedSiteForPlans}
                  onChange={(e) => setSelectedSiteForPlans(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 bg-white"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                    backgroundSize: "12px 12px",
                    backgroundPosition: "calc(100% - 12px) center",
                    backgroundRepeat: "no-repeat",
                    appearance: "none"
                  }}
                >
                  <option value="">{t('chooseASite')}</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSiteForPlans && (
                <>
                  {/* Plan Upload Form */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">{t('uploadPlan')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="planName">{t('planName')}</Label>
                        <Input
                          id="planName"
                          value={newPlanName}
                          onChange={(e) => setNewPlanName(e.target.value)}
                          placeholder={t('enterPlanName')}
                          disabled={isUploading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="planFile">{t('planFile')}</Label>
                        <Input
                          id="planFile"
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          disabled={isUploading}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                    {selectedFile && (
                      <div className="mt-2 text-sm text-gray-600">
                        Selected file: {selectedFile.name}
                      </div>
                    )}
                    <Button 
                      onClick={handleUploadPlan} 
                      className="w-full mt-4"
                      disabled={!selectedFile || !newPlanName.trim() || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {t('uploadPlan')}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Existing Plans Display */}
                  {plans.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-4">Existing Plans</h3>
                      <div className="space-y-3">
                        {plans.map((plan) => (
                          <div key={plan.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                              <FileImage className="h-5 w-5 text-gray-500" />
                              <div>
                                <span className="font-medium">{plan.plan_name}</span>
                                <div className="text-sm text-gray-500">
                                  <a 
                                    href={plan.plan_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-600 underline"
                                  >
                                    View Plan
                                  </a>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeletePlan(plan.id, plan.plan_name)}
                              disabled={isUploading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Collaboration Management */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manage Collaborators
              </CardTitle>
              <CardDescription>
                View and manage site collaborators and pending invitations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Site Selection for Collaborators */}
              <div className="space-y-2">
                <Label htmlFor="siteSelectCollaborators">Select Site</Label>
                <select
                  id="siteSelectCollaborators"
                  value={selectedSiteForCollaborators}
                  onChange={(e) => setSelectedSiteForCollaborators(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 bg-white"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                    backgroundSize: "12px 12px",
                    backgroundPosition: "calc(100% - 12px) center",
                    backgroundRepeat: "no-repeat",
                    appearance: "none"
                  }}
                >
                  <option value="">Choose a site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSiteForCollaborators && (
                <>
                  {/* Current Collaborators */}
                  {collaborators.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-4">Current Collaborators</h3>
                      <div className="space-y-3">
                        {collaborators.map((collaborator) => (
                          <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                              <Users className="h-5 w-5 text-gray-500" />
                              <div className="flex-1">
                                <span className="font-medium">{collaborator.email}</span>
                                <div className="text-sm text-gray-500 capitalize">
                                  {collaborator.role}
                                  {collaborator.role === 'owner' && ' (cannot be modified)'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Action buttons - only show for non-owners and not current user */}
                            {collaborator.role !== 'owner' && collaborator.user_id !== user?.id && (
                              <div className="flex items-center gap-2">
                                {/* Role change dropdown */}
                                <select
                                  value={collaborator.role}
                                  onChange={(e) => {
                                    const newRole = e.target.value as 'admin' | 'collaborator';
                                    if (newRole !== collaborator.role) {
                                      handleUpdateCollaboratorRole(
                                        collaborator.user_id, 
                                        collaborator.email || 'Unknown', 
                                        collaborator.role, 
                                        newRole
                                      );
                                    }
                                  }}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-400 bg-white"
                                  style={{
                                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                                    backgroundSize: "8px 8px",
                                    backgroundPosition: "calc(100% - 4px) center",
                                    backgroundRepeat: "no-repeat",
                                    appearance: "none",
                                    paddingRight: "16px"
                                  }}
                                >
                                  <option value="collaborator">Collaborator</option>
                                  <option value="admin">Admin</option>
                                </select>
                                
                                {/* Remove button */}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleRemoveCollaborator(collaborator.user_id, collaborator.email || 'Unknown')}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Invitations */}
                  {pendingInvitations.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-4">Pending Invitations</h3>
                      <div className="space-y-3">
                        {pendingInvitations.map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-md bg-yellow-50">
                            <div className="flex items-center gap-3">
                              <Users className="h-5 w-5 text-yellow-600" />
                              <div>
                                <span className="font-medium">{invitation.invited_email}</span>
                                <div className="text-sm text-gray-500 capitalize">
                                  {invitation.role} - Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-yellow-600">
                              Pending
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {collaborators.length === 0 && pendingInvitations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No collaborators or pending invitations for this site.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}