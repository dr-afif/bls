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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          organization_id: string | null
          request_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          request_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bls_topics: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          organization_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          organization_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bls_topics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_members: {
        Row: {
          added_by: string | null
          cohort_id: string
          completed_at: string | null
          joined_at: string
          member_role: Database["public"]["Enums"]["cohort_member_role"]
          membership_status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Insert: {
          added_by?: string | null
          cohort_id: string
          completed_at?: string | null
          joined_at?: string
          member_role: Database["public"]["Enums"]["cohort_member_role"]
          membership_status?: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Update: {
          added_by?: string | null
          cohort_id?: string
          completed_at?: string | null
          joined_at?: string
          member_role?: Database["public"]["Enums"]["cohort_member_role"]
          membership_status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_members_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          code: string
          contact_name: string | null
          contact_phone: string | null
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string
          id: string
          name: string
          organization_id: string
          preparation_notes: string | null
          start_at: string
          status: Database["public"]["Enums"]["cohort_status"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          code: string
          contact_name?: string | null
          contact_phone?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at: string
          id?: string
          name: string
          organization_id: string
          preparation_notes?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["cohort_status"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          code?: string
          contact_name?: string | null
          contact_phone?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string
          id?: string
          name?: string
          organization_id?: string
          preparation_notes?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["cohort_status"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_entitlements: {
        Row: {
          access_type: Database["public"]["Enums"]["entitlement_access_type"]
          activated_at: string | null
          cohort_id: string | null
          course_id: string
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          organization_id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["entitlement_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          access_type: Database["public"]["Enums"]["entitlement_access_type"]
          activated_at?: string | null
          cohort_id?: string | null
          course_id: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          organization_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["entitlement_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          access_type?: Database["public"]["Enums"]["entitlement_access_type"]
          activated_at?: string | null
          cohort_id?: string | null
          course_id?: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          organization_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["entitlement_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_entitlements_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_entitlements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_entitlements_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_entitlements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_entitlements_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          organization_id: string
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id: string
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          created_at: string
          department: string | null
          full_name: string
          id: string
          organization_id: string | null
          phone: string | null
          profession: string | null
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          department?: string | null
          full_name: string
          id: string
          organization_id?: string | null
          phone?: string | null
          profession?: string | null
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          organization_id?: string | null
          phone?: string | null
          profession?: string | null
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_access_events: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          request_id: string
          resource_id: string
          resource_version_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          request_id?: string
          resource_id: string
          resource_version_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          request_id?: string
          resource_id?: string
          resource_version_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_access_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_access_events_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_access_events_resource_version_id_fkey"
            columns: ["resource_version_id"]
            isOneToOne: false
            referencedRelation: "resource_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_access_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_audiences: {
        Row: {
          audience: Database["public"]["Enums"]["resource_audience"]
          created_at: string
          created_by: string | null
          resource_id: string
        }
        Insert: {
          audience: Database["public"]["Enums"]["resource_audience"]
          created_at?: string
          created_by?: string | null
          resource_id: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["resource_audience"]
          created_at?: string
          created_by?: string | null
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_audiences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_audiences_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_relations: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          related_resource_id: string
          resource_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          related_resource_id: string
          resource_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          related_resource_id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_relations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_relations_related_resource_id_fkey"
            columns: ["related_resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_relations_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_teaching_stages: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          resource_id: string
          teaching_stage_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          resource_id: string
          teaching_stage_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          resource_id?: string
          teaching_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_teaching_stages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_teaching_stages_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_teaching_stages_teaching_stage_id_fkey"
            columns: ["teaching_stage_id"]
            isOneToOne: false
            referencedRelation: "teaching_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_topics: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          resource_id: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          resource_id: string
          topic_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          resource_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_topics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_topics_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "bls_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content: Json | null
          content_hash: string | null
          created_at: string
          created_by: string | null
          guideline_source: string | null
          guideline_year: number | null
          id: string
          next_review_at: string | null
          resource_id: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["resource_status"]
          storage_path: string | null
          summary: string
          title: string
          version_number: number
          youtube_video_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content?: Json | null
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          guideline_source?: string | null
          guideline_year?: number | null
          id?: string
          next_review_at?: string | null
          resource_id: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["resource_status"]
          storage_path?: string | null
          summary: string
          title: string
          version_number: number
          youtube_video_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content?: Json | null
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          guideline_source?: string | null
          guideline_year?: number | null
          id?: string
          next_review_at?: string | null
          resource_id?: string
          resource_type?: Database["public"]["Enums"]["resource_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["resource_status"]
          storage_path?: string | null
          summary?: string
          title?: string
          version_number?: number
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_versions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_versions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          available_from: string | null
          available_until: string | null
          course_id: string
          created_at: string
          created_by: string | null
          current_version_id: string | null
          estimated_minutes: number | null
          featured: boolean
          id: string
          organization_id: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          slug: string
          status: Database["public"]["Enums"]["resource_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          estimated_minutes?: number | null
          featured?: boolean
          id?: string
          organization_id: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          slug: string
          status?: Database["public"]["Enums"]["resource_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          estimated_minutes?: number | null
          featured?: boolean
          id?: string
          organization_id?: string
          resource_type?: Database["public"]["Enums"]["resource_type"]
          slug?: string
          status?: Database["public"]["Enums"]["resource_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "resource_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_stages: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          organization_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          organization_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
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
      approve_resource_version: {
        Args: { target_version_id: string }
        Returns: undefined
      }
      authorize_resource_pdf_access: {
        Args: {
          target_request_id: string
          target_user_id: string
          target_version_id: string
        }
        Returns: {
          expires_in_seconds: number
          object_path: string
          organization_id: string
          resource_id: string
          resource_version_id: string
          user_id: string
        }[]
      }
      create_resource_version_draft: {
        Args: {
          draft_content?: Json
          draft_guideline_source?: string
          draft_guideline_year?: number
          draft_summary: string
          draft_title: string
          draft_youtube_video_id?: string
          target_resource_id: string
        }
        Returns: {
          storage_path: string
          version_id: string
          version_number: number
        }[]
      }
      discard_resource_version_draft: {
        Args: { target_version_id: string }
        Returns: undefined
      }
      get_resource_pdf_file_status: {
        Args: { target_version_id: string }
        Returns: {
          file_state: string
          object_path: string
        }[]
      }
      publish_resource_version: {
        Args: { target_resource_id: string; target_version_id: string }
        Returns: undefined
      }
      record_resource_pdf_issuance: {
        Args: {
          target_request_id: string
          target_user_id: string
          target_version_id: string
        }
        Returns: undefined
      }
      record_resource_version_review: {
        Args: { target_next_review_at: string; target_version_id: string }
        Returns: undefined
      }
      replace_resource_classifications: {
        Args: {
          target_audiences: Database["public"]["Enums"]["resource_audience"][]
          target_resource_id: string
          target_teaching_stage_ids: string[]
          target_topic_ids: string[]
        }
        Returns: undefined
      }
      retire_resource: {
        Args: { target_resource_id: string }
        Returns: undefined
      }
      submit_resource_version_for_review: {
        Args: { target_version_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_status:
        | "pending_verification"
        | "pending_approval"
        | "active"
        | "suspended"
        | "expired"
        | "archived"
      app_role: "learner" | "instructor" | "admin" | "super_admin"
      cohort_member_role: "learner" | "instructor"
      cohort_status:
        | "draft"
        | "scheduled"
        | "active"
        | "completed"
        | "cancelled"
        | "archived"
      course_status: "draft" | "published" | "retired" | "archived"
      entitlement_access_type: "permanent" | "fixed_window"
      entitlement_status: "pending" | "active" | "expired" | "revoked"
      membership_status: "active" | "completed" | "removed"
      resource_audience: "learner" | "instructor"
      resource_status:
        | "draft"
        | "under_review"
        | "approved"
        | "published"
        | "retired"
        | "archived"
      resource_type: "guide" | "checklist" | "pdf" | "youtube_video"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: [
        "pending_verification",
        "pending_approval",
        "active",
        "suspended",
        "expired",
        "archived",
      ],
      app_role: ["learner", "instructor", "admin", "super_admin"],
      cohort_member_role: ["learner", "instructor"],
      cohort_status: [
        "draft",
        "scheduled",
        "active",
        "completed",
        "cancelled",
        "archived",
      ],
      course_status: ["draft", "published", "retired", "archived"],
      entitlement_access_type: ["permanent", "fixed_window"],
      entitlement_status: ["pending", "active", "expired", "revoked"],
      membership_status: ["active", "completed", "removed"],
      resource_audience: ["learner", "instructor"],
      resource_status: [
        "draft",
        "under_review",
        "approved",
        "published",
        "retired",
        "archived",
      ],
      resource_type: ["guide", "checklist", "pdf", "youtube_video"],
    },
  },
} as const
