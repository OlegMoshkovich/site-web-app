// src/lib/observations.ts
import { createClient } from './client';
import type { 
  Observation, 
  SiteCollaborator, 
  CollaborationInvitation
} from '../../types/supabase';

/**
 * Fetch all observations for a user, newest first.
 */
export async function fetchUserObservations(userId: string): Promise<Observation[]> {
  if (!userId) throw new Error('User ID is required to fetch user observations');

  const supabase = createClient();
  const { data, error } = await supabase
    .from('observations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch all unique observation dates (YYYY-MM-DD) for a user, sorted descending.
 */
export async function fetchObservationDates(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('observations')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const seen = new Set<string>();
  const dates: string[] = [];

  for (const row of data ?? []) {
    const created = (row as { created_at?: string })?.created_at;
    if (!created) continue;
    const yyyyMmDd = created.split('T')[0];
    if (!seen.has(yyyyMmDd)) {
      seen.add(yyyyMmDd);
      dates.push(yyyyMmDd);
    }
  }
  return dates;
}

/**
 * Download a photo by its storage path (NOT a public URL).
 * Example path: "users/123/2025-08-17/photo.jpg"
 */
export async function downloadPhoto(path: string) {
    // console.log('downloadPhoto path from the function', path);
  try {
    if (!path?.trim()) {
      console.error('Invalid storage path provided:', path);
      return null;
    }

    const supabase = createClient();
    const { data, error } = await supabase.storage.from('photos').download(path);
    console.log('data from process photo', data);

    if (error) {
      console.error(`Storage error for ${path}:`, error);
      return null;
    }

    if (!data) {
      console.error(`No file data returned for ${path}`);
      return null;
    }

    return data; // Blob (web) or Blob-like (Expo RN)
  } catch (err) {
    console.error(`Exception downloading photo ${path}:`, err);
    return null;
  }
}

/**
 * Get the currently authenticated user.
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

// COLLABORATION FUNCTIONS

/**
 * Check if user has access to a site and return their role
 */
export async function getUserSiteRole(siteId: string, userId: string): Promise<SiteCollaborator['role'] | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_collaborators')
    .select('role')
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .single();

  if (error) return null;
  return data?.role || null;
}

/**
 * Get all collaborators for a site
 */
export async function getSiteCollaborators(siteId: string): Promise<SiteCollaborator[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_collaborators')
    .select('*')
    .eq('site_id', siteId)
    .eq('status', 'accepted')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Invite a user to collaborate on a site
 */
export async function inviteUserToSite(
  siteId: string, 
  invitedEmail: string, 
  invitedBy: string, 
  role: 'admin' | 'collaborator' = 'collaborator'
): Promise<CollaborationInvitation> {
  const supabase = createClient();
  
  // Check if user already has an invitation or is already a collaborator
  const { data: existing } = await supabase
    .from('collaboration_invitations')
    .select('*')
    .eq('site_id', siteId)
    .eq('invited_email', invitedEmail)
    .eq('status', 'pending')
    .single();

  if (existing) {
    throw new Error('User already has a pending invitation for this site');
  }

  // TODO: Check if user is already a collaborator by email lookup

  const { data, error } = await supabase
    .from('collaboration_invitations')
    .insert({
      site_id: siteId,
      invited_email: invitedEmail,
      invited_by: invitedBy,
      role: role
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(token: string, userId: string): Promise<SiteCollaborator> {
  const supabase = createClient();
  
  // Get the invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('collaboration_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single();

  if (inviteError || !invitation) {
    throw new Error('Invalid or expired invitation');
  }

  // Check if invitation is expired
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('collaboration_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);
    throw new Error('Invitation has expired');
  }

  // Add user as collaborator
  const { data: collaborator, error: collabError } = await supabase
    .from('site_collaborators')
    .insert({
      site_id: invitation.site_id,
      user_id: userId,
      invited_by: invitation.invited_by,
      role: invitation.role,
      status: 'accepted'
    })
    .select()
    .single();

  if (collabError) throw collabError;

  // Mark invitation as accepted
  await supabase
    .from('collaboration_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id);

  return collaborator;
}

/**
 * Get pending invitations for a site (for owners/admins)
 */
export async function getSitePendingInvitations(siteId: string): Promise<CollaborationInvitation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('collaboration_invitations')
    .select('*')
    .eq('site_id', siteId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Remove a collaborator from a site
 */
export async function removeCollaborator(siteId: string, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('site_collaborators')
    .delete()
    .eq('site_id', siteId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Update a collaborator's role
 */
export async function updateCollaboratorRole(
  siteId: string, 
  userId: string, 
  newRole: 'admin' | 'collaborator'
): Promise<SiteCollaborator> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('site_collaborators')
    .update({ role: newRole })
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch observations with collaboration permissions
 * - Owners and admins see all observations for sites they have access to
 * - Collaborators see only their own observations for sites they have access to
 */
export async function fetchCollaborativeObservations(userId: string): Promise<Observation[]> {
  const supabase = createClient();
  
  console.log('fetchCollaborativeObservations called for userId:', userId);
  
  // Get all sites where user is a collaborator
  const { data: userSites, error: sitesError } = await supabase
    .from('site_collaborators')
    .select('site_id, role')
    .eq('user_id', userId)
    .eq('status', 'accepted');

  console.log('userSites query result:', { userSites, sitesError });

  if (sitesError) throw sitesError;

  if (!userSites || userSites.length === 0) {
    console.log('No collaborative sites found, falling back to user observations');
    // User has no collaborative access, return only their own observations with user data
    const observations = await fetchUserObservations(userId);
    return await enrichObservationsWithUserData(observations);
  }

  
  // Build query based on user's roles
  const adminSiteIds = userSites
    .filter((site: { site_id: string; role: string }) => site.role === 'owner' || site.role === 'admin')
    .map((site: { site_id: string; role: string }) => site.site_id);
  
  const collaboratorSiteIds = userSites
    .filter((site: { site_id: string; role: string }) => site.role === 'collaborator')
    .map((site: { site_id: string; role: string }) => site.site_id);

  console.log('adminSiteIds:', adminSiteIds);
  console.log('collaboratorSiteIds:', collaboratorSiteIds);

  let query = supabase
    .from('observations')
    .select(`
      *,
      sites(name)
    `);

  // Build query to include ALL user's own observations PLUS collaborative observations
  const orConditions = [`user_id.eq.${userId}`]; // Always include all user's own observations

  // Add admin site access (all observations in admin sites)
  if (adminSiteIds.length > 0) {
    orConditions.push(`site_id.in.(${adminSiteIds.join(',')})`);
  }

  // Add collaborator site access (only user's observations in collaborator sites)
  if (collaboratorSiteIds.length > 0) {
    orConditions.push(`and(site_id.in.(${collaboratorSiteIds.join(',')}),user_id.eq.${userId})`);
  }

  query = query.or(orConditions.join(','));

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  
  // Enrich observations with user profile data
  return await enrichObservationsWithUserData(data ?? []);
}

/**
 * Helper function to enrich observations with user profile data
 * Since profiles table doesn't exist, we'll use auth.users but only for the current user
 */
async function enrichObservationsWithUserData(observations: Observation[]): Promise<Observation[]> {
  if (!observations.length) return [];
  
  const supabase = createClient();
  
  // Get current user data
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Error getting current user:', userError);
    return observations;
  }
  
  // For now, we can only get the current user's email
  // For other users, we'll show a user ID or create placeholder text
  return observations.map(obs => ({
    ...obs,
    profiles: obs.user_id === user.id 
      ? { email: user.email } 
      : { email: `User ${obs.user_id.slice(0, 8)}...` } // Show partial user ID as fallback
  }));
}

/**
 * Fetch observations for a specific site with proper permissions
 */
export async function fetchSiteObservations(siteId: string, userId: string): Promise<Observation[]> {
  const supabase = createClient();
  
  // Check user's role for this site
  const userRole = await getUserSiteRole(siteId, userId);
  
  if (!userRole) {
    throw new Error('You do not have access to this site');
  }

  let query = supabase
    .from('observations')
    .select('*')
    .eq('site_id', siteId);

  // If user is not owner/admin, show only their own observations
  if (userRole !== 'owner' && userRole !== 'admin') {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Get pending invitations for a user by email
 */
export async function getPendingInvitationsForUser(userEmail: string): Promise<(CollaborationInvitation & { site_name?: string })[]> {
  const supabase = createClient();
  
  const { data: invitations, error } = await supabase
    .from('collaboration_invitations')
    .select('*')
    .eq('invited_email', userEmail)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  if (!invitations || invitations.length === 0) {
    return [];
  }

  // Get site names for each invitation
  const invitationsWithSiteNames = await Promise.all(
    invitations.map(async (invitation: CollaborationInvitation) => {
      const { data: siteData } = await supabase
        .from('sites')
        .select('name')
        .eq('id', invitation.site_id)
        .single();

      return {
        ...invitation,
        site_name: siteData?.name || 'Unknown Site'
      };
    })
  );

  return invitationsWithSiteNames;
}
