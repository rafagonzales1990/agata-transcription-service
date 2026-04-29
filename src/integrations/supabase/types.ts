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
          audioDurationAddon: number | null
          color: string
          companyCNPJ: string | null
          companyName: string | null
          createdAt: string
          description: string | null
          id: string
          isGift: boolean | null
          isInternal: boolean | null
          maxDurationMinutes: number | null
          maxTotalMinutesMonth: number | null
          maxTranscriptions: number | null
          name: string
          tier: string | null
          updatedAt: string
          usersBase: number | null
        }
        Insert: {
          audioDurationAddon?: number | null
          color?: string
          companyCNPJ?: string | null
          companyName?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          isGift?: boolean | null
          isInternal?: boolean | null
          maxDurationMinutes?: number | null
          maxTotalMinutesMonth?: number | null
          maxTranscriptions?: number | null
          name: string
          tier?: string | null
          updatedAt?: string
          usersBase?: number | null
        }
        Update: {
          audioDurationAddon?: number | null
          color?: string
          companyCNPJ?: string | null
          companyName?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          isGift?: boolean | null
          isInternal?: boolean | null
          maxDurationMinutes?: number | null
          maxTotalMinutesMonth?: number | null
          maxTranscriptions?: number | null
          name?: string
          tier?: string | null
          updatedAt?: string
          usersBase?: number | null
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
      AtaVersion: {
        Row: {
          ataContent: string
          ataTemplate: string
          createdAt: string
          id: string
          meetingId: string
          userId: string
          versionNumber: number
        }
        Insert: {
          ataContent: string
          ataTemplate: string
          createdAt?: string
          id?: string
          meetingId: string
          userId: string
          versionNumber?: number
        }
        Update: {
          ataContent?: string
          ataTemplate?: string
          createdAt?: string
          id?: string
          meetingId?: string
          userId?: string
          versionNumber?: number
        }
        Relationships: [
          {
            foreignKeyName: "AtaVersion_meetingId_fkey"
            columns: ["meetingId"]
            isOneToOne: false
            referencedRelation: "Meeting"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AtaVersion_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      AuthorizedDevice: {
        Row: {
          authorizedAt: string
          deviceId: string
          deviceName: string | null
          id: string
          userId: string
        }
        Insert: {
          authorizedAt?: string
          deviceId: string
          deviceName?: string | null
          id?: string
          userId: string
        }
        Update: {
          authorizedAt?: string
          deviceId?: string
          deviceName?: string | null
          id?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "AuthorizedDevice_userId_fkey"
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
      CalendarIntegration: {
        Row: {
          accessToken: string
          createdAt: string
          expiresAt: string | null
          id: string
          provider: string
          refreshToken: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          accessToken: string
          createdAt?: string
          expiresAt?: string | null
          id?: string
          provider: string
          refreshToken?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          accessToken?: string
          createdAt?: string
          expiresAt?: string | null
          id?: string
          provider?: string
          refreshToken?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "CalendarIntegration_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
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
      HealthCheckLog: {
        Row: {
          createdAt: string
          detail: string | null
          id: string
          latencyMs: number | null
          provider: string
          status: string
        }
        Insert: {
          createdAt?: string
          detail?: string | null
          id?: string
          latencyMs?: number | null
          provider: string
          status: string
        }
        Update: {
          createdAt?: string
          detail?: string | null
          id?: string
          latencyMs?: number | null
          provider?: string
          status?: string
        }
        Relationships: []
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
          assemblyTranscriptId: string | null
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
          assemblyTranscriptId?: string | null
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
          assemblyTranscriptId?: string | null
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
      MeetingConflict: {
        Row: {
          conflictDescription: string
          conflictingMeetingId: string
          conflictType: string | null
          createdAt: string
          id: string
          meetingId: string
          severity: string
          updatedAt: string
        }
        Insert: {
          conflictDescription: string
          conflictingMeetingId: string
          conflictType?: string | null
          createdAt?: string
          id?: string
          meetingId: string
          severity: string
          updatedAt?: string
        }
        Update: {
          conflictDescription?: string
          conflictingMeetingId?: string
          conflictType?: string | null
          createdAt?: string
          id?: string
          meetingId?: string
          severity?: string
          updatedAt?: string
        }
        Relationships: []
      }
      MeetingEmbedding: {
        Row: {
          chunkIndex: number
          chunkText: string
          createdAt: string | null
          embedding: string | null
          id: string
          meetingId: string
          userId: string
        }
        Insert: {
          chunkIndex?: number
          chunkText: string
          createdAt?: string | null
          embedding?: string | null
          id?: string
          meetingId: string
          userId: string
        }
        Update: {
          chunkIndex?: number
          chunkText?: string
          createdAt?: string | null
          embedding?: string | null
          id?: string
          meetingId?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_meeting"
            columns: ["meetingId"]
            isOneToOne: false
            referencedRelation: "Meeting"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "MeetingEmbedding_meetingId_fkey"
            columns: ["meetingId"]
            isOneToOne: false
            referencedRelation: "Meeting"
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
      NurturingLog: {
        Row: {
          emailType: string
          id: string
          sentAt: string
          userId: string
        }
        Insert: {
          emailType: string
          id?: string
          sentAt?: string
          userId: string
        }
        Update: {
          emailType?: string
          id?: string
          sentAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "NurturingLog_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
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
          maxDurationMinutes: number | null
          maxProjects: number | null
          maxTotalMinutesMonth: number | null
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
          maxProjects?: number | null
          maxTotalMinutesMonth?: number | null
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
          maxProjects?: number | null
          maxTotalMinutesMonth?: number | null
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
          googleCalendarToken: string | null
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
          termsAcceptedAt: string | null
          termsVersion: string | null
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
          googleCalendarToken?: string | null
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
          termsAcceptedAt?: string | null
          termsVersion?: string | null
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
          googleCalendarToken?: string | null
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
          termsAcceptedAt?: string | null
          termsVersion?: string | null
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
      UserSession: {
        Row: {
          createdAt: string
          deviceId: string
          deviceName: string | null
          id: string
          ipAddress: string | null
          isActive: boolean
          lastSeen: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          deviceId: string
          deviceName?: string | null
          id?: string
          ipAddress?: string | null
          isActive?: boolean
          lastSeen?: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          deviceId?: string
          deviceName?: string | null
          id?: string
          ipAddress?: string | null
          isActive?: boolean
          lastSeen?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserSession_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
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
      get_meeting_by_share_token: {
        Args: { share_token: string }
        Returns: {
          createdAt: string
          expiresAt: string
          id: string
          meetingId: string
          token: string
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      get_my_team_id: { Args: never; Returns: string }
      get_old_user_id: { Args: { _auth_uid: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_enterprise_admin: { Args: never; Returns: boolean }
      match_meeting_embeddings:
        | {
            Args: {
              match_count?: number
              match_user_id: string
              query_embedding: string
            }
            Returns: {
              chunkText: string
              createdAt: string
              meetingId: string
              similarity: number
              title: string
            }[]
          }
        | {
            Args: {
              filter_meeting_id?: string
              match_count?: number
              match_user_id: string
              query_embedding: string
            }
            Returns: {
              chunkText: string
              createdAt: string
              meetingId: string
              similarity: number
              title: string
            }[]
          }
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
