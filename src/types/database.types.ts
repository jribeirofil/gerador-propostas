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
      category: {
        Row: {
          id: string
          name: string
          slug: string
          color: string
          sort_order: number
          created_at: string
          organization_id: string
        }
        Insert: {
          id?: string
          name?: string
          slug?: string
          color?: string
          sort_order?: number
          created_at?: string
          organization_id?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          color?: string
          sort_order?: number
          created_at?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          id: string
          empresa: string
          cnpj: string | null
          contato: string
          cargo: string | null
          email: string | null
          whatsapp: string | null
          colaboradores: number | null
          segmento: string | null
          created_by: string | null
          created_at: string | null
          rd_lead_id: string | null
          origem: string | null
          updated_from_rd_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          empresa?: string
          cnpj?: string | null
          contato?: string
          cargo?: string | null
          email?: string | null
          whatsapp?: string | null
          colaboradores?: number | null
          segmento?: string | null
          created_by?: string | null
          created_at?: string | null
          rd_lead_id?: string | null
          origem?: string | null
          updated_from_rd_at?: string | null
          organization_id?: string
        }
        Update: {
          id?: string
          empresa?: string
          cnpj?: string | null
          contato?: string
          cargo?: string | null
          email?: string | null
          whatsapp?: string | null
          colaboradores?: number | null
          segmento?: string | null
          created_by?: string | null
          created_at?: string | null
          rd_lead_id?: string | null
          origem?: string | null
          updated_from_rd_at?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          id: string
          company_name: string
          company_site: string | null
          company_email: string | null
          company_phone: string | null
          company_whatsapp: string | null
          logo_url: string | null
          primary_color: string
          secondary_color: string | null
          pdf_footer_text: string | null
          pdf_default_conditions: string | null
          signer_name: string | null
          signer_role: string | null
          signer_email: string | null
          signer_phone: string | null
          updated_at: string | null
          updated_by: string | null
          ai_tone: string | null
          cover_bg_url: string | null
          organization_id: string
          cover_video_url: string | null
          company_about: string | null
        }
        Insert: {
          id?: string
          company_name?: string
          company_site?: string | null
          company_email?: string | null
          company_phone?: string | null
          company_whatsapp?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string | null
          pdf_footer_text?: string | null
          pdf_default_conditions?: string | null
          signer_name?: string | null
          signer_role?: string | null
          signer_email?: string | null
          signer_phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
          ai_tone?: string | null
          cover_bg_url?: string | null
          organization_id?: string
          cover_video_url?: string | null
          company_about?: string | null
        }
        Update: {
          id?: string
          company_name?: string
          company_site?: string | null
          company_email?: string | null
          company_phone?: string | null
          company_whatsapp?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string | null
          pdf_footer_text?: string | null
          pdf_default_conditions?: string | null
          signer_name?: string | null
          signer_role?: string | null
          signer_email?: string | null
          signer_phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
          ai_tone?: string | null
          cover_bg_url?: string | null
          organization_id?: string
          cover_video_url?: string | null
          company_about?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      content_library: {
        Row: {
          id: string
          type: string
          title: string
          content: Json
          created_by: string | null
          created_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          type?: string
          title?: string
          content?: Json
          created_by?: string | null
          created_at?: string | null
          organization_id?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          content?: Json
          created_by?: string | null
          created_at?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          id: string
          provider: string
          refresh_token: string
          connected_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          provider?: string
          refresh_token?: string
          connected_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
        Update: {
          id?: string
          provider?: string
          refresh_token?: string
          connected_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          id: string
          name: string
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name?: string
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_table: {
        Row: {
          id: string
          product_id: string
          name: string
          description: string | null
          active: boolean
          created_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          product_id?: string
          name?: string
          description?: string | null
          active?: boolean
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          description?: string | null
          active?: boolean
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_table_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      price_table_item: {
        Row: {
          id: string
          price_table_id: string
          minimum_quantity: number
          maximum_quantity: number | null
          unit_price: number
          sort_order: number
          active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          price_table_id?: string
          minimum_quantity?: number
          maximum_quantity?: number | null
          unit_price?: number
          sort_order?: number
          active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          price_table_id?: string
          minimum_quantity?: number
          maximum_quantity?: number | null
          unit_price?: number
          sort_order?: number
          active?: boolean
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_table_item_price_table_id_fkey"
            columns: ["price_table_id"]
            isOneToOne: false
            referencedRelation: "price_table"
            referencedColumns: ["id"]
          },
        ]
      }
      product: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          active: boolean
          sort_order: number
          created_at: string | null
          updated_at: string | null
          calculation_type: string | null
          billing_frequency: string | null
          default_price_table_id: string | null
          unit_label: string
          category: string | null
          organization_id: string
          commercial_conditions: string | null
        }
        Insert: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          active?: boolean
          sort_order?: number
          created_at?: string | null
          updated_at?: string | null
          calculation_type?: string | null
          billing_frequency?: string | null
          default_price_table_id?: string | null
          unit_label?: string
          category?: string | null
          organization_id?: string
          commercial_conditions?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          active?: boolean
          sort_order?: number
          created_at?: string | null
          updated_at?: string | null
          calculation_type?: string | null
          billing_frequency?: string | null
          default_price_table_id?: string | null
          unit_label?: string
          category?: string | null
          organization_id?: string
          commercial_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_default_price_table_id_fkey"
            columns: ["default_price_table_id"]
            isOneToOne: false
            referencedRelation: "price_table"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      product_benefit: {
        Row: {
          id: string
          product_id: string
          title: string
          sort_order: number
          active: boolean
        }
        Insert: {
          id?: string
          product_id?: string
          title?: string
          sort_order?: number
          active?: boolean
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          sort_order?: number
          active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_benefit_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_differential: {
        Row: {
          id: string
          product_id: string
          title: string
          sort_order: number
          active: boolean
        }
        Insert: {
          id?: string
          product_id?: string
          title?: string
          sort_order?: number
          active?: boolean
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          sort_order?: number
          active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_differential_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_faq: {
        Row: {
          id: string
          product_id: string
          question: string
          answer: string
          sort_order: number
          active: boolean
        }
        Insert: {
          id?: string
          product_id?: string
          question?: string
          answer?: string
          sort_order?: number
          active?: boolean
        }
        Update: {
          id?: string
          product_id?: string
          question?: string
          answer?: string
          sort_order?: number
          active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_faq_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_scope: {
        Row: {
          id: string
          product_id: string
          title: string
          sort_order: number
          active: boolean
        }
        Insert: {
          id?: string
          product_id?: string
          title?: string
          sort_order?: number
          active?: boolean
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          sort_order?: number
          active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_scope_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string
          created_at: string | null
          job_title: string | null
          phone: string | null
          active: boolean
          organization_id: string
        }
        Insert: {
          id?: string
          full_name?: string | null
          role?: string
          created_at?: string | null
          job_title?: string | null
          phone?: string | null
          active?: boolean
          organization_id?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string
          created_at?: string | null
          job_title?: string | null
          phone?: string | null
          active?: boolean
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal: {
        Row: {
          id: string
          client_id: string | null
          template_id: string | null
          title: string
          status: string
          diagnosis: string | null
          objectives: string | null
          commercial_notes: string | null
          discount_percent: number | null
          discount_value: number | null
          total_setup: number | null
          total_monthly: number | null
          total_amount: number | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          version: number
          version_group: string | null
          is_archived: boolean
          archived_at: string | null
          validade_dias: number
          forma_pagamento: string | null
          prazo_implantacao: string | null
          public_token: string | null
          opportunity_status: string
          lost_reason: string | null
          lost_comment: string | null
          code: number
          has_pending_review: boolean | null
          vigencia_contrato: string | null
          organization_id: string
          commercial_conditions: string | null
          sent_at: string | null
          followup_days: number
        }
        Insert: {
          id?: string
          client_id?: string | null
          template_id?: string | null
          title?: string
          status?: string
          diagnosis?: string | null
          objectives?: string | null
          commercial_notes?: string | null
          discount_percent?: number | null
          discount_value?: number | null
          total_setup?: number | null
          total_monthly?: number | null
          total_amount?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          version?: number
          version_group?: string | null
          is_archived?: boolean
          archived_at?: string | null
          validade_dias?: number
          forma_pagamento?: string | null
          prazo_implantacao?: string | null
          public_token?: string | null
          opportunity_status?: string
          lost_reason?: string | null
          lost_comment?: string | null
          code?: number
          has_pending_review?: boolean | null
          vigencia_contrato?: string | null
          organization_id?: string
          commercial_conditions?: string | null
          sent_at?: string | null
          followup_days?: number
        }
        Update: {
          id?: string
          client_id?: string | null
          template_id?: string | null
          title?: string
          status?: string
          diagnosis?: string | null
          objectives?: string | null
          commercial_notes?: string | null
          discount_percent?: number | null
          discount_value?: number | null
          total_setup?: number | null
          total_monthly?: number | null
          total_amount?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          version?: number
          version_group?: string | null
          is_archived?: boolean
          archived_at?: string | null
          validade_dias?: number
          forma_pagamento?: string | null
          prazo_implantacao?: string | null
          public_token?: string | null
          opportunity_status?: string
          lost_reason?: string | null
          lost_comment?: string | null
          code?: number
          has_pending_review?: boolean | null
          vigencia_contrato?: string | null
          organization_id?: string
          commercial_conditions?: string | null
          sent_at?: string | null
          followup_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "proposal_template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_analytics: {
        Row: {
          id: string
          proposal_id: string
          event_type: string
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          proposal_id?: string
          event_type?: string
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          proposal_id?: string
          event_type?: string
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_analytics_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposal"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_block: {
        Row: {
          id: string
          proposal_id: string
          type: string
          title: string | null
          content_json: Json
          sort_order: number
          enabled: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          proposal_id?: string
          type?: string
          title?: string | null
          content_json?: Json
          sort_order?: number
          enabled?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          proposal_id?: string
          type?: string
          title?: string | null
          content_json?: Json
          sort_order?: number
          enabled?: boolean
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_block_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposal"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_event: {
        Row: {
          id: string
          proposal_id: string
          event_type: string
          created_by: string | null
          created_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          proposal_id?: string
          event_type?: string
          created_by?: string | null
          created_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          proposal_id?: string
          event_type?: string
          created_by?: string | null
          created_at?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_event_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_event_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_product: {
        Row: {
          id: string
          proposal_id: string
          product_id: string | null
          quantity: number
          pricing_type: string
          unit_value: number | null
          monthly_value: number | null
          setup_value: number | null
          discount_percent: number | null
          discount_value: number | null
          subtotal: number | null
          notes: string | null
          snapshot: Json
          sort_order: number
          created_at: string | null
          manual_override: boolean
          override_reason: string | null
        }
        Insert: {
          id?: string
          proposal_id?: string
          product_id?: string | null
          quantity?: number
          pricing_type?: string
          unit_value?: number | null
          monthly_value?: number | null
          setup_value?: number | null
          discount_percent?: number | null
          discount_value?: number | null
          subtotal?: number | null
          notes?: string | null
          snapshot?: Json
          sort_order?: number
          created_at?: string | null
          manual_override?: boolean
          override_reason?: string | null
        }
        Update: {
          id?: string
          proposal_id?: string
          product_id?: string | null
          quantity?: number
          pricing_type?: string
          unit_value?: number | null
          monthly_value?: number | null
          setup_value?: number | null
          discount_percent?: number | null
          discount_value?: number | null
          subtotal?: number | null
          notes?: string | null
          snapshot?: Json
          sort_order?: number
          created_at?: string | null
          manual_override?: boolean
          override_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_product_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_product_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_template: {
        Row: {
          id: string
          name: string
          description: string | null
          is_default: boolean
          created_at: string | null
          slug: string | null
          product_slugs: string[]
          cover_image_url: string | null
          cover_video_url: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          name?: string
          description?: string | null
          is_default?: boolean
          created_at?: string | null
          slug?: string | null
          product_slugs?: string[]
          cover_image_url?: string | null
          cover_video_url?: string | null
          organization_id?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_default?: boolean
          created_at?: string | null
          slug?: string | null
          product_slugs?: string[]
          cover_image_url?: string | null
          cover_video_url?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_template_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      template_block: {
        Row: {
          id: string
          template_id: string
          type: string
          sort_order: number
          enabled: boolean
          title: string | null
          default_content: Json
          created_at: string | null
        }
        Insert: {
          id?: string
          template_id?: string
          type?: string
          sort_order?: number
          enabled?: boolean
          title?: string | null
          default_content?: Json
          created_at?: string | null
        }
        Update: {
          id?: string
          template_id?: string
          type?: string
          sort_order?: number
          enabled?: boolean
          title?: string | null
          default_content?: Json
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_block_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "proposal_template"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          full_name: string
          email: string
          role: string
          job_title: string
          phone: string
          active: boolean
          created_at: string
          last_sign_in_at: string
          count: number
        }
      }
      current_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_org_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
