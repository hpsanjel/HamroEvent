export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      budget_items: {
        Row: {
          amount: number
          category: string
          date: string
          event_id: string
          id: string
          note: string | null
          owner_id: string | null
          type: string
        }
        Insert: {
          amount?: number
          category: string
          date?: string
          event_id: string
          id: string
          note?: string | null
          owner_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          date?: string
          event_id?: string
          id?: string
          note?: string | null
          owner_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          date: string
          donor: string
          event_id: string
          id: string
          note: string | null
          owner_id: string | null
          type: string
        }
        Insert: {
          amount?: number
          date?: string
          donor: string
          event_id: string
          id: string
          note?: string | null
          owner_id?: string | null
          type?: string
        }
        Update: {
          amount?: number
          date?: string
          donor?: string
          event_id?: string
          id?: string
          note?: string | null
          owner_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          contact_name: string
          contact_phone: string
          cover_image: string | null
          created_at: string
          currency: string | null
          description: string
          end_date: string
          entry_fee: number
          event_type: string
          id: string
          max_teams: number
          name: string
          owner_id: string | null
          payment_info: string
          payment_qr_data_url: string | null
          prize_pool: number
          registration_deadline: string
          sport: string
          start_date: string
          status: string
          venue: string
        }
        Insert: {
          banner_url?: string | null
          contact_name?: string
          contact_phone?: string
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          description?: string
          end_date: string
          entry_fee?: number
          event_type?: string
          id: string
          max_teams?: number
          name: string
          owner_id?: string | null
          payment_info?: string
          payment_qr_data_url?: string | null
          prize_pool?: number
          registration_deadline: string
          sport: string
          start_date: string
          status?: string
          venue?: string
        }
        Update: {
          banner_url?: string | null
          contact_name?: string
          contact_phone?: string
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          description?: string
          end_date?: string
          entry_fee?: number
          event_type?: string
          id?: string
          max_teams?: number
          name?: string
          owner_id?: string | null
          payment_info?: string
          payment_qr_data_url?: string | null
          prize_pool?: number
          registration_deadline?: string
          sport?: string
          start_date?: string
          status?: string
          venue?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          event_id: string
          id: string
          match_no: number
          owner_id: string | null
          round: number
          scheduled_at: string | null
          score_a: number | null
          score_b: number | null
          status: string
          team_a: string | null
          team_b: string | null
          venue: string | null
          winner: string | null
        }
        Insert: {
          event_id: string
          id: string
          match_no: number
          owner_id?: string | null
          round: number
          scheduled_at?: string | null
          score_a?: number | null
          score_b?: number | null
          status?: string
          team_a?: string | null
          team_b?: string | null
          venue?: string | null
          winner?: string | null
        }
        Update: {
          event_id?: string
          id?: string
          match_no?: number
          owner_id?: string | null
          round?: number
          scheduled_at?: string | null
          score_a?: number | null
          score_b?: number | null
          status?: string
          team_a?: string | null
          team_b?: string | null
          venue?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          name: string
          role: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          is_active?: boolean
          last_login?: string | null
          name?: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          captain_email: string
          captain_name: string
          captain_phone: string
          checked_in: boolean
          event_id: string
          id: string
          notes: string | null
          owner_id: string | null
          payment_proof: string | null
          payment_ref: string | null
          players: Json
          status: string
          submitted_at: string
          team_name: string
        }
        Insert: {
          captain_email?: string
          captain_name: string
          captain_phone?: string
          checked_in?: boolean
          event_id: string
          id: string
          notes?: string | null
          owner_id?: string | null
          payment_proof?: string | null
          payment_ref?: string | null
          players?: Json
          status?: string
          submitted_at?: string
          team_name: string
        }
        Update: {
          captain_email?: string
          captain_name?: string
          captain_phone?: string
          checked_in?: boolean
          event_id?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          payment_proof?: string | null
          payment_ref?: string | null
          players?: Json
          status?: string
          submitted_at?: string
          team_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_orders: {
        Row: {
          buyer_email: string | null
          buyer_name: string
          buyer_phone: string | null
          checked_in: boolean
          event_id: string
          id: string
          notes: string | null
          owner_id: string | null
          payment_proof: string | null
          payment_ref: string | null
          quantity: number
          status: string
          submitted_at: string
          ticket_id: string
          total: number
        }
        Insert: {
          buyer_email?: string | null
          buyer_name: string
          buyer_phone?: string | null
          checked_in?: boolean
          event_id: string
          id: string
          notes?: string | null
          owner_id?: string | null
          payment_proof?: string | null
          payment_ref?: string | null
          quantity?: number
          status?: string
          submitted_at?: string
          ticket_id: string
          total?: number
        }
        Update: {
          buyer_email?: string | null
          buyer_name?: string
          buyer_phone?: string | null
          checked_in?: boolean
          event_id?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          payment_proof?: string | null
          payment_ref?: string | null
          quantity?: number
          status?: string
          submitted_at?: string
          ticket_id?: string
          total?: number
        }
        Relationships: []
      }
      tickets: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          name: string
          owner_id: string | null
          price: number
          quantity: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id: string
          name: string
          owner_id?: string | null
          price?: number
          quantity?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          owner_id?: string | null
          price?: number
          quantity?: number
          sort_order?: number
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
