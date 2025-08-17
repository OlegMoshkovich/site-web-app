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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
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
export type Observation = Database['public']['Tables']['observations']['Row']
export type ObservationInsert = Database['public']['Tables']['observations']['Insert']
export type ObservationUpdate = Database['public']['Tables']['observations']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
