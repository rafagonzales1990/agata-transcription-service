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
      AtaTemplate: {
        Row: {
          createdAt: string
          description: string | null
          id: string
          isDefault: boolean
          name: string
          sections: Json
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id?: string
          isDefault?: boolean
          name: string
          sections?: Json
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: string
          isDefault?: boolean
          name?: string
          sections?: Json
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "AtaTemplate_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
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
      ExtensionRecording: {
        Row: {
          browser: string | null
          createdAt: string
          durationSeconds: number | null
          extensionVersion: string | null
          fileSizeBytes: number | null
          id: string
          meetingId: string | null
          meetingTitle: string | null
          meetingUrl: string | null
          platform: string
          startedAt: string
          status: string
          updatedAt: string
          uploadedAt: string | null
          userId: string
        }
        Insert: {
          browser?: string | null
          createdAt?: string
          durationSeconds?: number | null
          extensionVersion?: string | null
          fileSizeBytes?: number | null
          id?: string
          meetingId?: string | null
          meetingTitle?: string | null
          meetingUrl?: string | null
          platform: string
          startedAt?: string
          status?: string
          updatedAt?: string
          uploadedAt?: string | null
          userId: string
        }
        Update: {
          browser?: string | null
          createdAt?: string
          durationSeconds?: number | null
          extensionVersion?: string | null
          fileSizeBytes?: number | null
          id?: string
          meetingId?: string | null
          meetingTitle?: string | null
          meetingUrl?: string | null
          platform?: string
          startedAt?: string
          status?: string
          updatedAt?: string
          uploadedAt?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ExtensionRecording_meetingId_fkey"
            columns: ["meetingId"]
            isOneToOne: false
            referencedRelation: "Meeting"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ExtensionRecording_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Lead: {
        Row: {
          campaign: string | null
          company: string | null
          content: string | null
          convertedAt: string | null
          createdAt: string
          demoCompletedAt: string | null
          demoFollowup24hSent: boolean
          demoFollowup72hSent: boolean
          email: string | null
          id: string
          lastStep: string
          linkedinUrl: string | null
          medium: string | null
          meetingId: string | null
          name: string | null
          notes: string | null
          persona: string | null
          phone: string | null
          role: string | null
          source: string
          status: string
          trialStartedAt: string | null
          updatedAt: string
          userId: string | null
        }
        Insert: {
          campaign?: string | null
          company?: string | null
          content?: string | null
          convertedAt?: string | null
          createdAt?: string
          demoCompletedAt?: string | null
          demoFollowup24hSent?: boolean
          demoFollowup72hSent?: boolean
          email?: string | null
          id?: string
          lastStep?: string
          linkedinUrl?: string | null
          medium?: string | null
          meetingId?: string | null
          name?: string | null
          notes?: string | null
          persona?: string | null
          phone?: string | null
          role?: string | null
          source?: string
          status?: string
          trialStartedAt?: string | null
          updatedAt?: string
          userId?: string | null
        }
        Update: {
          campaign?: string | null
          company?: string | null
          content?: string | null
          convertedAt?: string | null
          createdAt?: string
          demoCompletedAt?: string | null
          demoFollowup24hSent?: boolean
          demoFollowup72hSent?: boolean
          email?: string | null
          id?: string
          lastStep?: string
          linkedinUrl?: string | null
          medium?: string | null
          meetingId?: string | null
          name?: string | null
          notes?: string | null
          persona?: string | null
          phone?: string | null
          role?: string | null
          source?: string
          status?: string
          trialStartedAt?: string | null
          updatedAt?: string
          userId?: string | null
        }
        Relationships: []
      }
      Meeting: {
        Row: {
          actionItems: string[]
          ataPdfUrl: string | null
          ataSections: Json | null
          ataTemplate: string | null
          ataTemplateId: string | null
          cloudStoragePath: string
          createdAt: string
          description: string | null
          errorMessage: string | null
          fileDeleted: boolean
          fileDuration: number | null
          fileExpiresAt: string | null
          fileName: string
          fileSize: number
          followupDraft: Json | null
          id: string
          isPublic: boolean
          location: string | null
          meetingDate: string | null
          meetingTime: string | null
          participants: string[]
          projectId: string | null
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
          ataSections?: Json | null
          ataTemplate?: string | null
          ataTemplateId?: string | null
          cloudStoragePath: string
          createdAt?: string
          description?: string | null
          errorMessage?: string | null
          fileDeleted?: boolean
          fileDuration?: number | null
          fileExpiresAt?: string | null
          fileName: string
          fileSize: number
          followupDraft?: Json | null
          id?: string
          isPublic?: boolean
          location?: string | null
          meetingDate?: string | null
          meetingTime?: string | null
          participants?: string[]
          projectId?: string | null
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
          ataSections?: Json | null
          ataTemplate?: string | null
          ataTemplateId?: string | null
          cloudStoragePath?: string
          createdAt?: string
          description?: string | null
          errorMessage?: string | null
          fileDeleted?: boolean
          fileDuration?: number | null
          fileExpiresAt?: string | null
          fileName?: string
          fileSize?: number
          followupDraft?: Json | null
          id?: string
          isPublic?: boolean
          location?: string | null
          meetingDate?: string | null
          meetingTime?: string | null
          participants?: string[]
          projectId?: string | null
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
            foreignKeyName: "Meeting_ataTemplateId_fkey"
            columns: ["ataTemplateId"]
            isOneToOne: false
            referencedRelation: "AtaTemplate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Meeting_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "Project"
            referencedColumns: ["id"]
          },
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
      MeetingShare: {
        Row: {
          createdAt: string
          expiresAt: string | null
          id: string
          meetingId: string
          token: string
        }
        Insert: {
          createdAt?: string
          expiresAt?: string | null
          id?: string
          meetingId: string
          token?: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string | null
          id?: string
          meetingId?: string
          token?: string
        }
        Relationships: []
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
          maxDurationMinutes: number | null
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
          maxDurationMinutes?: number | null
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
          maxDurationMinutes?: number | null
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
          gift_ends_at: string | null
          gift_plan_id: string | null
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
          gift_ends_at?: string | null
          gift_plan_id?: string | null
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
          gift_ends_at?: string | null
          gift_plan_id?: string | null
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
      Project: {
        Row: {
          color: string
          createdAt: string
          id: string
          name: string
          teamId: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          color?: string
          createdAt?: string
          id?: string
          name: string
          teamId?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          color?: string
          createdAt?: string
          id?: string
          name?: string
          teamId?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Project_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
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
      TeamInvite: {
        Row: {
          acceptedAt: string | null
          createdAt: string
          email: string
          expiresAt: string
          id: string
          invitedBy: string
          status: string
          teamId: string
          token: string
          updatedAt: string
        }
        Insert: {
          acceptedAt?: string | null
          createdAt?: string
          email: string
          expiresAt?: string
          id?: string
          invitedBy: string
          status?: string
          teamId: string
          token?: string
          updatedAt?: string
        }
        Update: {
          acceptedAt?: string | null
          createdAt?: string
          email?: string
          expiresAt?: string
          id?: string
          invitedBy?: string
          status?: string
          teamId?: string
          token?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "TeamInvite_invitedBy_fkey"
            columns: ["invitedBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TeamInvite_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "Team"
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
          upgradeSuggestionSentMonth: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          currentMonth: string
          id?: string
          totalMinutesTranscribed?: number
          transcriptionsUsed?: number
          updatedAt?: string
          upgradeSuggestionSentMonth?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          currentMonth?: string
          id?: string
          totalMinutesTranscribed?: number
          transcriptionsUsed?: number
          updatedAt?: string
          upgradeSuggestionSentMonth?: string | null
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
          giftEndsAt: string | null
          giftPlanId: string | null
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
          role: string
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
          giftEndsAt?: string | null
          giftPlanId?: string | null
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
          role?: string
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
          giftEndsAt?: string | null
          giftPlanId?: string | null
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
          role?: string
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
