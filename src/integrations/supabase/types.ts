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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      Account: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      AdminGroup: {
        Row: {
          color: string
          createdAt: string
          description: string | null
          id: string
          name: string
          updatedAt: string
        }
        Insert: {
          color?: string
          createdAt?: string
          description?: string | null
          id?: string
          name: string
          updatedAt?: string
        }
        Update: {
          color?: string
          createdAt?: string
          description?: string | null
          id?: string
          name?: string
          updatedAt?: string
        }
        Relationships: []
      }
      BlogPost: {
        Row: {
          category: string
          content: string
          coverImage: string | null
          createdAt: string
          excerpt: string
          id: string
          metaDescription: string | null
          metaTitle: string | null
          published: boolean
          readTime: number
          slug: string
          tags: string[]
          title: string
          updatedAt: string
        }
        Insert: {
          category?: string
          content: string
          coverImage?: string | null
          createdAt?: string
          excerpt: string
          id?: string
          metaDescription?: string | null
          metaTitle?: string | null
          published?: boolean
          readTime?: number
          slug: string
          tags?: string[]
          title: string
          updatedAt?: string
        }
        Update: {
          category?: string
          content?: string
          coverImage?: string | null
          createdAt?: string
          excerpt?: string
          id?: string
          metaDescription?: string | null
          metaTitle?: string | null
          published?: boolean
          readTime?: number
          slug?: string
          tags?: string[]
          title?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Meeting: {
        Row: {
          actionItems: string[]
          ataPdfUrl: string | null
          ataTemplate: string | null
          cloudStoragePath: string
          createdAt: string
          description: string | null
          errorMessage: string | null
          fileDeleted: boolean
          fileDuration: number | null
          fileExpiresAt: string | null
          fileName: string
          fileSize: number
          id: string
          isPublic: boolean
          location: string | null
          meetingDate: string | null
          meetingTime: string | null
          participants: string[]
          responsible: string | null
          routineId: string | null
          status: string
          summary: string | null
          title: string
          transcription: string | null
          updatedAt: string
          userId: string
          visibility: string
          workGroupId: string | null
        }
        Insert: {
          actionItems?: string[]
          ataPdfUrl?: string | null
          ataTemplate?: string | null
          cloudStoragePath: string
          createdAt?: string
          description?: string | null
          errorMessage?: string | null
          fileDeleted?: boolean
          fileDuration?: number | null
          fileExpiresAt?: string | null
          fileName: string
          fileSize: number
          id?: string
          isPublic?: boolean
          location?: string | null
          meetingDate?: string | null
          meetingTime?: string | null
          participants?: string[]
          responsible?: string | null
          routineId?: string | null
          status?: string
          summary?: string | null
          title: string
          transcription?: string | null
          updatedAt?: string
          userId: string
          visibility?: string
          workGroupId?: string | null
        }
        Update: {
          actionItems?: string[]
          ataPdfUrl?: string | null
          ataTemplate?: string | null
          cloudStoragePath?: string
          createdAt?: string
          description?: string | null
          errorMessage?: string | null
          fileDeleted?: boolean
          fileDuration?: number | null
          fileExpiresAt?: string | null
          fileName?: string
          fileSize?: number
          id?: string
          isPublic?: boolean
          location?: string | null
          meetingDate?: string | null
          meetingTime?: string | null
          participants?: string[]
          responsible?: string | null
          routineId?: string | null
          status?: string
          summary?: string | null
          title?: string
          transcription?: string | null
          updatedAt?: string
          userId?: string
          visibility?: string
          workGroupId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Meeting_routineId_fkey"
            columns: ["routineId"]
            isOneToOne: false
            referencedRelation: "Routine"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Meeting_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Meeting_workGroupId_fkey"
            columns: ["workGroupId"]
            isOneToOne: false
            referencedRelation: "WorkGroup"
            referencedColumns: ["id"]
          },
        ]
      }
      Plan: {
        Row: {
          allowAdvancedSummary: boolean
          allowCustomTemplates: boolean
          allowPdfGeneration: boolean
          createdAt: string
          description: string
          features: string[]
          id: string
          maxDurationMinutes: number
          maxTranscriptions: number
          name: string
          popular: boolean
          priceMonthly: number
          priceYearly: number
          updatedAt: string
        }
        Insert: {
          allowAdvancedSummary?: boolean
          allowCustomTemplates?: boolean
          allowPdfGeneration?: boolean
          createdAt?: string
          description: string
          features?: string[]
          id: string
          maxDurationMinutes: number
          maxTranscriptions: number
          name: string
          popular?: boolean
          priceMonthly: number
          priceYearly: number
          updatedAt?: string
        }
        Update: {
          allowAdvancedSummary?: boolean
          allowCustomTemplates?: boolean
          allowPdfGeneration?: boolean
          createdAt?: string
          description?: string
          features?: string[]
          id?: string
          maxDurationMinutes?: number
          maxTranscriptions?: number
          name?: string
          popular?: boolean
          priceMonthly?: number
          priceYearly?: number
          updatedAt?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          billing_cycle: string | null
          cpf: string | null
          created_at: string
          email: string
          has_completed_onboarding: boolean
          id: string
          image: string | null
          name: string | null
          old_user_id: string | null
          phone: string | null
          plan_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          has_completed_onboarding?: boolean
          id?: string
          image?: string | null
          name?: string | null
          old_user_id?: string | null
          phone?: string | null
          plan_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          has_completed_onboarding?: boolean
          id?: string
          image?: string | null
          name?: string | null
          old_user_id?: string | null
          phone?: string | null
          plan_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      Routine: {
        Row: {
          color: string
          consolidatedSummary: string | null
          createdAt: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updatedAt: string
          userId: string
        }
        Insert: {
          color?: string
          consolidatedSummary?: string | null
          createdAt?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updatedAt?: string
          userId: string
        }
        Update: {
          color?: string
          consolidatedSummary?: string | null
          createdAt?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Routine_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Session: {
        Row: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Insert: {
          expires: string
          id?: string
          sessionToken: string
          userId: string
        }
        Update: {
          expires?: string
          id?: string
          sessionToken?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Team: {
        Row: {
          companyName: string | null
          createdAt: string
          id: string
          logoUrl: string | null
          name: string
          ownerId: string
          primaryColor: string | null
          secondaryColor: string | null
          updatedAt: string
        }
        Insert: {
          companyName?: string | null
          createdAt?: string
          id?: string
          logoUrl?: string | null
          name: string
          ownerId: string
          primaryColor?: string | null
          secondaryColor?: string | null
          updatedAt?: string
        }
        Update: {
          companyName?: string | null
          createdAt?: string
          id?: string
          logoUrl?: string | null
          name?: string
          ownerId?: string
          primaryColor?: string | null
          secondaryColor?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Team_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      TranscriptionLog: {
        Row: {
          chunks: number
          costCents: number
          createdAt: string
          durationSecs: number
          errorMessage: string | null
          fileSizeBytes: number
          id: string
          meetingId: string
          provider: string
          success: boolean
          userId: string
        }
        Insert: {
          chunks?: number
          costCents?: number
          createdAt?: string
          durationSecs: number
          errorMessage?: string | null
          fileSizeBytes: number
          id?: string
          meetingId: string
          provider: string
          success?: boolean
          userId: string
        }
        Update: {
          chunks?: number
          costCents?: number
          createdAt?: string
          durationSecs?: number
          errorMessage?: string | null
          fileSizeBytes?: number
          id?: string
          meetingId?: string
          provider?: string
          success?: boolean
          userId?: string
        }
        Relationships: []
      }
      Usage: {
        Row: {
          createdAt: string
          currentMonth: string
          id: string
          totalMinutesTranscribed: number
          transcriptionsUsed: number
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          currentMonth: string
          id?: string
          totalMinutesTranscribed?: number
          transcriptionsUsed?: number
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          currentMonth?: string
          id?: string
          totalMinutesTranscribed?: number
          transcriptionsUsed?: number
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Usage_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          adminGroupId: string | null
          billingCycle: string | null
          cpf: string | null
          createdAt: string
          email: string
          emailVerified: string | null
          hasCompletedOnboarding: boolean
          id: string
          image: string | null
          isAdmin: boolean
          isInternal: boolean
          isTeamOwner: boolean
          name: string | null
          password: string | null
          phone: string | null
          planId: string | null
          resetToken: string | null
          resetTokenExpiry: string | null
          stripeCustomerId: string | null
          stripePriceId: string | null
          stripeSubscriptionId: string | null
          teamId: string | null
          trialEndsAt: string | null
          trialExpiredEmailSent: boolean
          trialWarningEmailSent: boolean
          updatedAt: string
        }
        Insert: {
          adminGroupId?: string | null
          billingCycle?: string | null
          cpf?: string | null
          createdAt?: string
          email: string
          emailVerified?: string | null
          hasCompletedOnboarding?: boolean
          id?: string
          image?: string | null
          isAdmin?: boolean
          isInternal?: boolean
          isTeamOwner?: boolean
          name?: string | null
          password?: string | null
          phone?: string | null
          planId?: string | null
          resetToken?: string | null
          resetTokenExpiry?: string | null
          stripeCustomerId?: string | null
          stripePriceId?: string | null
          stripeSubscriptionId?: string | null
          teamId?: string | null
          trialEndsAt?: string | null
          trialExpiredEmailSent?: boolean
          trialWarningEmailSent?: boolean
          updatedAt?: string
        }
        Update: {
          adminGroupId?: string | null
          billingCycle?: string | null
          cpf?: string | null
          createdAt?: string
          email?: string
          emailVerified?: string | null
          hasCompletedOnboarding?: boolean
          id?: string
          image?: string | null
          isAdmin?: boolean
          isInternal?: boolean
          isTeamOwner?: boolean
          name?: string | null
          password?: string | null
          phone?: string | null
          planId?: string | null
          resetToken?: string | null
          resetTokenExpiry?: string | null
          stripeCustomerId?: string | null
          stripePriceId?: string | null
          stripeSubscriptionId?: string | null
          teamId?: string | null
          trialEndsAt?: string | null
          trialExpiredEmailSent?: boolean
          trialWarningEmailSent?: boolean
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "User_adminGroupId_fkey"
            columns: ["adminGroupId"]
            isOneToOne: false
            referencedRelation: "AdminGroup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "User_planId_fkey"
            columns: ["planId"]
            isOneToOne: false
            referencedRelation: "Plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "User_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "Team"
            referencedColumns: ["id"]
          },
        ]
      }
      VerificationToken: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
      WorkGroup: {
        Row: {
          color: string | null
          createdAt: string
          description: string | null
          id: string
          name: string
          teamId: string
          updatedAt: string
        }
        Insert: {
          color?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          name: string
          teamId: string
          updatedAt?: string
        }
        Update: {
          color?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          name?: string
          teamId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "WorkGroup_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "Team"
            referencedColumns: ["id"]
          },
        ]
      }
      WorkGroupMember: {
        Row: {
          createdAt: string
          id: string
          role: string
          userId: string
          workGroupId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          role?: string
          userId: string
          workGroupId: string
        }
        Update: {
          createdAt?: string
          id?: string
          role?: string
          userId?: string
          workGroupId?: string
        }
        Relationships: [
          {
            foreignKeyName: "WorkGroupMember_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WorkGroupMember_workGroupId_fkey"
            columns: ["workGroupId"]
            isOneToOne: false
            referencedRelation: "WorkGroup"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_old_user_id: { Args: { _auth_uid: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
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
