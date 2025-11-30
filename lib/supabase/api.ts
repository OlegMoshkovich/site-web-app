// src/lib/observations.ts
import { createClient } from './client';
import type { 
  Observation, 
  SiteCollaborator, 
  CollaborationInvitation,
  Profile
} from '../../types/supabase';

// Clean up file paths by removing leading slashes and empty strings
const normalizePath = (v?: string | null) =>
  (v ?? "").trim().replace(/^\/+/, "") || null;

const BUCKET = "photos";

/**
 * Generate a temporary signed URL for viewing a photo from Supabase storage
 */
export async function getSignedPhotoUrl(
  filenameOrPath: string,
  expiresIn = 3600,
): Promise<string | null> {
  // Clean up the file path
  const key = normalizePath(filenameOrPath);
  if (!key) {
    console.warn("getSignedPhotoUrl: Empty or invalid path provided:", filenameOrPath);
    return null;
  }

  let supabase;
  
  try {
    // Check if we're in a server context by checking for window
    if (typeof window === 'undefined') {
      // Server-side: use server client with service role for storage access
      const { createServerClient } = await import('@supabase/ssr');
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() { return []; },
            setAll() { /* no-op */ },
          },
        }
      );
    } else {
      // Client-side: use browser client
      supabase = createClient();
    }
    
    // Request a signed URL from Supabase storage
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(key, expiresIn);

    if (error) {
      console.warn("createSignedUrl failed for key:", key, {
        bucket: BUCKET,
        errorMessage: error.message,
        errorCode: error.code,
        isServerSide: typeof window === 'undefined'
      });
      return null;
    }

    return data?.signedUrl || null;
  } catch (err) {
    console.error("getSignedPhotoUrl unexpected error:", {
      key,
      bucket: BUCKET,
      error: err,
      isServerSide: typeof window === 'undefined'
    });
    return null;
  }
}

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
  try {
    if (!path?.trim()) {
      console.error('Invalid storage path provided:', path);
      return null;
    }

    const supabase = createClient();
    const { data, error } = await supabase.storage.from('photos').download(path);

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
  
  // Check if user already has a pending invitation
  const { data: existingInvitation } = await supabase
    .from('collaboration_invitations')
    .select('*')
    .eq('site_id', siteId)
    .eq('invited_email', invitedEmail)
    .eq('status', 'pending')
    .single();

  if (existingInvitation) {
    throw new Error('This user already has a pending invitation for this site');
  }

  // Check if user is already a collaborator by looking up their profile
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', invitedEmail)
    .single();

  if (userProfile) {
    // User exists, check if they're already a collaborator
    const { data: existingCollaborator } = await supabase
      .from('site_collaborators')
      .select('*')
      .eq('site_id', siteId)
      .eq('user_id', userProfile.id)
      .eq('status', 'accepted')
      .single();

    if (existingCollaborator) {
      throw new Error('This user is already a collaborator on this site');
    }
  }

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

  if (error) {
    // Handle duplicate key constraint error specifically
    if (error.code === '23505' && error.message.includes('duplicate key')) {
      throw new Error('This user has already been invited to this site');
    }
    throw error;
  }
  
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

  // Check if user is already a collaborator on this site
  const { data: existingCollaborator } = await supabase
    .from('site_collaborators')
    .select('*')
    .eq('site_id', invitation.site_id)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .single();

  if (existingCollaborator) {
    // User is already a collaborator, just mark the invitation as accepted
    await supabase
      .from('collaboration_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);
    
    return existingCollaborator;
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

  if (collabError) {
    // Handle duplicate key constraint error
    if (collabError.code === '23505' && collabError.message.includes('duplicate key')) {
      // User is already a collaborator, fetch their existing record
      const { data: existing } = await supabase
        .from('site_collaborators')
        .select('*')
        .eq('site_id', invitation.site_id)
        .eq('user_id', userId)
        .single();
      
      if (existing) {
        // Mark invitation as accepted
        await supabase
          .from('collaboration_invitations')
          .update({ status: 'accepted' })
          .eq('id', invitation.id);
        
        return existing;
      }
    }
    throw collabError;
  }

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
 * Fetch observations for a specific time range with collaboration permissions
 * - Returns observations from the last N days/weeks/months
 * - Owners and admins see all observations for sites they have access to
 * - Collaborators see only their own observations for sites they have access to
 */
export async function fetchCollaborativeObservationsByTimeRange(
  userId: string,
  timeRange: {
    type: 'days' | 'weeks' | 'months';
    count: number;
    offset: number;
  }
): Promise<{ observations: Observation[], hasMore: boolean, totalCount: number }> {
  const supabase = createClient();
  
  
  // Calculate date range based on type
  const now = new Date();
  const startDate = new Date(now);
  const endDate = new Date(now);
  
  switch (timeRange.type) {
    case 'days':
      startDate.setDate(now.getDate() - (timeRange.count + timeRange.offset));
      endDate.setDate(now.getDate() - timeRange.offset);
      break;
    case 'weeks':
      startDate.setDate(now.getDate() - (7 * (timeRange.count + timeRange.offset)));
      endDate.setDate(now.getDate() - (7 * timeRange.offset));
      break;
    case 'months':
      startDate.setMonth(now.getMonth() - (timeRange.count + timeRange.offset));
      endDate.setMonth(now.getMonth() - timeRange.offset);
      break;
  }
  
  
  // Get all sites where user is a collaborator
  const { data: userSites, error: sitesError } = await supabase
    .from('site_collaborators')
    .select('site_id, role')
    .eq('user_id', userId)
    .eq('status', 'accepted');


  if (sitesError) throw sitesError;

  // Build base query
  let query = supabase.from('observations').select(`
    *,
    sites(name, logo_url)
  `, { count: 'exact' });

  if (!userSites || userSites.length === 0) {
    // User has no collaborative access, return only their own observations
    query = query.eq('user_id', userId);
  } else {
    // Build query based on user's roles
    const adminSiteIds = userSites
      .filter((site: { site_id: string; role: string }) => site.role === 'owner' || site.role === 'admin')
      .map((site: { site_id: string; role: string }) => site.site_id);
    
    const collaboratorSiteIds = userSites
      .filter((site: { site_id: string; role: string }) => site.role === 'collaborator')
      .map((site: { site_id: string; role: string }) => site.site_id);

    
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
  }

  // Apply date range filter and ordering
  const { data, error, count } = await query
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Check if there are more observations available by looking for observations older than our date range
  let hasMoreQuery = supabase.from('observations').select('id', { count: 'exact', head: true });
  
  if (!userSites || userSites.length === 0) {
    hasMoreQuery = hasMoreQuery.eq('user_id', userId);
  } else {
    const adminSiteIds = userSites
      .filter((site: { site_id: string; role: string }) => site.role === 'owner' || site.role === 'admin')
      .map((site: { site_id: string; role: string }) => site.site_id);
    
    const collaboratorSiteIds = userSites
      .filter((site: { site_id: string; role: string }) => site.role === 'collaborator')
      .map((site: { site_id: string; role: string }) => site.site_id);

    const orConditions = [`user_id.eq.${userId}`];

    if (adminSiteIds.length > 0) {
      orConditions.push(`site_id.in.(${adminSiteIds.join(',')})`);
    }

    if (collaboratorSiteIds.length > 0) {
      orConditions.push(`and(site_id.in.(${collaboratorSiteIds.join(',')}),user_id.eq.${userId})`);
    }

    hasMoreQuery = hasMoreQuery.or(orConditions.join(','));
  }
  
  const { count: olderCount } = await hasMoreQuery.lt('created_at', startDate.toISOString());
  const hasMore = (olderCount || 0) > 0;
  
  // Enrich observations with user profile data
  const enrichedData = await enrichObservationsWithUserData(data ?? []);
  
  return {
    observations: enrichedData,
    hasMore,
    totalCount: count || 0
  };
}

/**
 * Fetch observations for a specific week with collaboration permissions (legacy wrapper)
 * - Returns observations from the last N weeks
 * - Owners and admins see all observations for sites they have access to
 * - Collaborators see only their own observations for sites they have access to
 */
export async function fetchCollaborativeObservationsByWeek(
  userId: string,
  weeksToLoad: number = 1,
  weekOffset: number = 0
): Promise<{ observations: Observation[], hasMore: boolean, totalCount: number }> {
  return fetchCollaborativeObservationsByTimeRange(userId, {
    type: 'weeks',
    count: weeksToLoad,
    offset: weekOffset
  });
}

/**
 * Fetch observations with collaboration permissions using pagination
 * - Loads observations in weekly chunks starting from most recent
 * - Owners and admins see all observations for sites they have access to
 * - Collaborators see only their own observations for sites they have access to
 */
export async function fetchCollaborativeObservationsPaginated(
  userId: string, 
  limit: number = 50,
  offset: number = 0
): Promise<{ observations: Observation[], hasMore: boolean, totalCount: number }> {
  const supabase = createClient();
  
  
  // Get all sites where user is a collaborator
  const { data: userSites, error: sitesError } = await supabase
    .from('site_collaborators')
    .select('site_id, role')
    .eq('user_id', userId)
    .eq('status', 'accepted');


  if (sitesError) throw sitesError;

  // Build base query
  let query = supabase.from('observations').select(`
    *,
    sites(name, logo_url)
  `, { count: 'exact' });

  if (!userSites || userSites.length === 0) {
    // User has no collaborative access, return only their own observations
    query = query.eq('user_id', userId);
  } else {
    // Build query based on user's roles
    const adminSiteIds = userSites
      .filter((site: { site_id: string; role: string }) => site.role === 'owner' || site.role === 'admin')
      .map((site: { site_id: string; role: string }) => site.site_id);
    
    const collaboratorSiteIds = userSites
      .filter((site: { site_id: string; role: string }) => site.role === 'collaborator')
      .map((site: { site_id: string; role: string }) => site.site_id);

    
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
  }

  // Apply pagination and ordering
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  
  const totalCount = count || 0;
  const hasMore = offset + limit < totalCount;
  
  // Enrich observations with user profile data
  const enrichedData = await enrichObservationsWithUserData(data ?? []);
  
  return {
    observations: enrichedData,
    hasMore,
    totalCount
  };
}

/**
 * Fetch observations with collaboration permissions (legacy function for compatibility)
 * - Owners and admins see all observations for sites they have access to
 * - Collaborators see only their own observations for sites they have access to
 */
export async function fetchCollaborativeObservations(userId: string): Promise<Observation[]> {
  const supabase = createClient();
  
  
  // Get all sites where user is a collaborator
  const { data: userSites, error: sitesError } = await supabase
    .from('site_collaborators')
    .select('site_id, role')
    .eq('user_id', userId)
    .eq('status', 'accepted');


  if (sitesError) throw sitesError;

  if (!userSites || userSites.length === 0) {
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


  let query = supabase
    .from('observations')
    .select(`
      *,
      sites(name, logo_url)
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
 */
async function enrichObservationsWithUserData(observations: Observation[]): Promise<Observation[]> {
  if (!observations.length) return [];
  
  const supabase = createClient();
  
  // Get unique user IDs from observations
  const userIds = [...new Set(observations.map(obs => obs.user_id))];
  
  try {
    // Try to get profiles from profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);
    
    if (!profilesError && profiles && profiles.length > 0) {
      // Create a map of user_id to profile data
      const profileMap = new Map<string, Pick<Profile, 'id' | 'email' | 'full_name'>>(
        profiles.map((profile: Pick<Profile, 'id' | 'email' | 'full_name'>) => [profile.id, profile])
      );
      
      return observations.map(obs => ({
        ...obs,
        user_email: profileMap.get(obs.user_id)?.email || `User ${obs.user_id.slice(0, 8)}...`,
        user_name: profileMap.get(obs.user_id)?.full_name || null
      }));
    } else {
      console.warn('No profiles found or error fetching profiles:', profilesError);
    }
  } catch (error) {
    console.warn('Profiles table not available, using fallback user display:', error);
  }
  
  // Fallback: Get current user data from auth
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    // Final fallback: show partial user ID
    return observations.map(obs => ({
      ...obs,
      user_email: `User ${obs.user_id.slice(0, 8)}...`,
      user_name: null
    }));
  }
  
  // Show current user's email, others get user ID fallback
  return observations.map(obs => ({
    ...obs,
    user_email: obs.user_id === user.id ? user.email || 'Unknown User' : `User ${obs.user_id.slice(0, 8)}...`,
    user_name: null
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

/**
 * Fetch a single observation for public sharing (no authentication required)
 * This returns only public information suitable for sharing
 */
export async function fetchSharedObservation(observationId: string): Promise<Observation | null> {
  // Use createServerClient with service role key to bypass RLS for shared access
  const { createServerClient } = await import('@supabase/ssr');
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op for public access
        },
      },
    }
  );
  
  const { data: observation, error } = await supabase
    .from('observations')
    .select(`
      *,
      sites(name, logo_url)
    `)
    .eq('id', observationId)
    .single();

  if (error) {
    console.error('Error fetching shared observation:', error);
    return null;
  }

  return observation;
}
