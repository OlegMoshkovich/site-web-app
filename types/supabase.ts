export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      observations: {
        Row: {
          id: string
          user_id: string
          site_id: string | null
          created_at: string
          updated_at: string
          photo_url: string | null
          note: string | null
          anchor_x: number | null
          anchor_y: number | null
          labels: string[] | null
          latitude: number | null
          longitude: number | null
          taken_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          site_id?: string | null
          created_at?: string
          updated_at?: string
          photo_url?: string | null
          note?: string | null
          anchor_x?: number | null
          anchor_y?: number | null
          labels?: string[] | null
          latitude?: number | null
          longitude?: number | null
          taken_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          site_id?: string | null
          created_at?: string
          updated_at?: string
          photo_url?: string | null
          note?: string | null
          anchor_x?: number | null
          anchor_y?: number | null
          labels?: string[] | null
          latitude?: number | null
          longitude?: number | null
          taken_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          onboarding_completed: boolean
          last_sign_in_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          onboarding_completed?: boolean
          last_sign_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          onboarding_completed?: boolean
          last_sign_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      site_collaborators: {
        Row: {
          id: string
          site_id: string
          user_id: string
          invited_by: string | null
          role: 'owner' | 'admin' | 'collaborator'
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          user_id: string
          invited_by?: string | null
          role?: 'owner' | 'admin' | 'collaborator'
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          user_id?: string
          invited_by?: string | null
          role?: 'owner' | 'admin' | 'collaborator'
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
      }
      collaboration_invitations: {
        Row: {
          id: string
          site_id: string
          invited_email: string
          invited_by: string
          role: 'admin' | 'collaborator'
          token: string
          expires_at: string
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          invited_email: string
          invited_by: string
          role?: 'admin' | 'collaborator'
          token?: string
          expires_at?: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          invited_email?: string
          invited_by?: string
          role?: 'admin' | 'collaborator'
          token?: string
          expires_at?: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
          settings: Json
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
          settings?: Json
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          settings?: Json
        }
      }
      report_observations: {
        Row: {
          id: string
          report_id: string
          observation_id: string
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          observation_id: string
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          observation_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers for easier usage
export type Observation = Database['public']['Tables']['observations']['Row'] & {
  user_email?: string;
  user_name?: string | null;
}
export type ObservationInsert = Database['public']['Tables']['observations']['Insert']
export type ObservationUpdate = Database['public']['Tables']['observations']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type SiteCollaborator = Database['public']['Tables']['site_collaborators']['Row']
export type SiteCollaboratorInsert = Database['public']['Tables']['site_collaborators']['Insert']
export type SiteCollaboratorUpdate = Database['public']['Tables']['site_collaborators']['Update']

export type CollaborationInvitation = Database['public']['Tables']['collaboration_invitations']['Row']
export type CollaborationInvitationInsert = Database['public']['Tables']['collaboration_invitations']['Insert']
export type CollaborationInvitationUpdate = Database['public']['Tables']['collaboration_invitations']['Update']

export type Report = Database['public']['Tables']['reports']['Row']
export type ReportInsert = Database['public']['Tables']['reports']['Insert']
export type ReportUpdate = Database['public']['Tables']['reports']['Update']

export type ReportObservation = Database['public']['Tables']['report_observations']['Row']
export type ReportObservationInsert = Database['public']['Tables']['report_observations']['Insert']
export type ReportObservationUpdate = Database['public']['Tables']['report_observations']['Update']
