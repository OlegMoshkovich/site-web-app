// Core observation data structure from Supabase database
export interface Observation {
  id: string;                    // Unique identifier for the observation
  plan: string | null;           // Plan name/identifier this observation belongs to
  site_name: string | null;      // Name of the site/location
  labels: string[] | null;       // Array of tags/labels for categorization
  user_id: string;               // ID of the user who created this observation
  note: string | null;           // Text description/notes about the observation
  gps_lat: number | null;        // GPS latitude coordinate
  gps_lng: number | null;        // GPS longitude coordinate
  photo_url: string | null;      // Storage path to the photo file
  plan_url: string | null;       // URL to view the associated plan
  plan_anchor: Record<string, unknown> | null; // Position coordinates on the plan
  photo_date: string | null;     // When the photo was taken
  taken_at: string | null;       // Full timestamp when available
  created_at: string;            // When the observation was created in the system
  user_email?: string;           // User email from profiles table (enriched data)
  user_name?: string | null;     // User full name from profiles table (enriched data)
}

// Extended observation with signed URL for secure photo access
export interface ObservationWithUrl extends Observation {
  signedUrl: string | null;      // Temporary signed URL for viewing the photo
}
