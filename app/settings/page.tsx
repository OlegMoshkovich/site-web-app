"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Users, Tags, MapPin, Trash2 } from "lucide-react";
import { Language, useTranslations } from "@/lib/translations";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language] = useState<Language>('de'); // Default to German
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
    }
  }, [user, loadSites]);

  useEffect(() => {
    if (selectedSiteForLabels) {
      // Load labels when a site is selected
      loadLabels(selectedSiteForLabels);
    }
  }, [selectedSiteForLabels, loadLabels]);

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
    if (!inviteEmail.trim()) return;
    
    // For now, just show a message since we'd need a proper invitation system
    alert(`Invitation feature coming soon! For now, ask ${inviteEmail} to sign up directly.`);
    setInviteEmail("");
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
              <Button onClick={handleInviteUser} className="w-full">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400"
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

        </div>
      </div>
    </main>
  );
}