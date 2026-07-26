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
      bonus_videos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          title: string
          vimeo_id: string
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: string
          title: string
          vimeo_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          title?: string
          vimeo_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_number_encrypted: string
          account_number_last4: string
          bank_name: string
          created_at: string
          first_name: string
          id: string
          last_name: string
          profile_id: string
          routing_number_encrypted: string
          routing_number_last4: string
          updated_at: string
        }
        Insert: {
          account_number_encrypted: string
          account_number_last4: string
          bank_name: string
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          profile_id: string
          routing_number_encrypted: string
          routing_number_last4: string
          updated_at?: string
        }
        Update: {
          account_number_encrypted?: string
          account_number_last4?: string
          bank_name?: string
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          profile_id?: string
          routing_number_encrypted?: string
          routing_number_last4?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      postback_field_mappings: {
        Row: {
          source_param: string
          target_field: string
          updated_at: string
        }
        Insert: {
          source_param: string
          target_field: string
          updated_at?: string
        }
        Update: {
          source_param?: string
          target_field?: string
          updated_at?: string
        }
        Relationships: []
      }
      postback_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          raw_params: Json
          resolved_email: string | null
          resolved_user_id: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          raw_params: Json
          resolved_email?: string | null
          resolved_user_id?: string | null
          success: boolean
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          raw_params?: Json
          resolved_email?: string | null
          resolved_user_id?: string | null
          success?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_color: string | null
          avatar_initial: string | null
          balance: number
          completed_videos: number
          created_at: string
          email: string
          first_login_at: string | null
          full_name: string | null
          id: string
          in_transit: number
          member_since: string | null
          primeiro_acesso: string | null
          total_paid_out: number
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_color?: string | null
          avatar_initial?: string | null
          balance?: number
          completed_videos?: number
          created_at?: string
          email: string
          first_login_at?: string | null
          full_name?: string | null
          id: string
          in_transit?: number
          member_since?: string | null
          primeiro_acesso?: string | null
          total_paid_out?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_color?: string | null
          avatar_initial?: string | null
          balance?: number
          completed_videos?: number
          created_at?: string
          email?: string
          first_login_at?: string | null
          full_name?: string | null
          id?: string
          in_transit?: number
          member_since?: string | null
          primeiro_acesso?: string | null
          total_paid_out?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reminder_email_log: {
        Row: {
          id: string
          profile_id: string
          sent_at: string
          step_id: string
        }
        Insert: {
          id?: string
          profile_id: string
          sent_at?: string
          step_id: string
        }
        Update: {
          id?: string
          profile_id?: string
          sent_at?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_email_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_email_log_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "reminder_email_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_email_steps: {
        Row: {
          body_html: string
          created_at: string
          delay_hours: number
          id: string
          is_active: boolean
          step_order: number
          subject: string
          updated_at: string
        }
        Insert: {
          body_html: string
          created_at?: string
          delay_hours: number
          id?: string
          is_active?: boolean
          step_order: number
          subject: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          created_at?: string
          delay_hours?: number
          id?: string
          is_active?: boolean
          step_order?: number
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      reward_history: {
        Row: {
          amount: number
          created_at: string
          date_label: string | null
          id: string
          profile_id: string
          title: string
          video_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          date_label?: string | null
          id?: string
          profile_id: string
          title: string
          video_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date_label?: string | null
          id?: string
          profile_id?: string
          title?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_progress: {
        Row: {
          created_at: string
          id: string
          is_unlocked: boolean
          profile_id: string
          rewarded: boolean
          unlock_days_remaining: number | null
          updated_at: string
          video_id: string
          watched: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          is_unlocked?: boolean
          profile_id: string
          rewarded?: boolean
          unlock_days_remaining?: number | null
          updated_at?: string
          video_id: string
          watched?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          is_unlocked?: boolean
          profile_id?: string
          rewarded?: boolean
          unlock_days_remaining?: number | null
          updated_at?: string
          video_id?: string
          watched?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdraw_history: {
        Row: {
          amount: number
          created_at: string
          date_label: string | null
          id: string
          profile_id: string
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date_label?: string | null
          id?: string
          profile_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date_label?: string | null
          id?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdraw_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_video_review: {
        Args: {
          p_amount: number
          p_profile_id: string
          p_title: string
          p_video_id: string
        }
        Returns: Json
      }
      get_payment_method_decrypted: {
        Args: { p_profile_id: string }
        Returns: {
          account_number: string
          bank_name: string
          first_name: string
          last_name: string
          routing_number: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      save_payment_method: {
        Args: {
          p_account_number: string
          p_bank_name: string
          p_first_name: string
          p_last_name: string
          p_profile_id: string
          p_routing_number: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
