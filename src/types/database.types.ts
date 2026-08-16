export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      category: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          organization_id: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          organization_id?: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          cargo: string | null
          cnpj: string | null
          colaboradores: number | null
          contato: string
          created_at: string | null
          created_by: string | null
          email: string | null
          empresa: string
          id: string
          organization_id: string
          origem: string | null
          rd_lead_id: string | null
          segmento: string | null
          updated_from_rd_at: string | null
          whatsapp: string | null
        }
        Insert: {
          cargo?: string | null
          cnpj?: string | null
          colaboradores?: number | null
          contato: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          empresa: string
          id?: string
          organization_id?: string
          origem?: string | null
          rd_lead_id?: string | null
          segmento?: string | null
          updated_from_rd_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          cargo?: string | null
          cnpj?: string | null
          colaboradores?: number | null
          contato?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          empresa?: string
          id?: string
          organization_id?: string
          origem?: string | null
          rd_lead_id?: string | null
          segmento?: string | null
          updated_from_rd_at?: string | null
          whatsapp?: string | null
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
            foreignKeyName: "clients_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          ai_tone: string | null
          company_about: string | null
          company_email: string | null
          company_name: string
          company_phone: string | null
          company_site: string | null
          company_whatsapp: string | null
          id: string
          logo_url: string | null
          organization_id: string
          pdf_default_conditions: string | null
          pdf_footer_text: string | null
          primary_color: string
          secondary_color: string | null
          signer_email: string | null
          signer_name: string | null
          signer_phone: string | null
          signer_role: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ai_tone?: string | null
          company_about?: string | null
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          company_site?: string | null
          company_whatsapp?: string | null
          id?: string
          logo_url?: string | null
          organization_id?: string
          pdf_default_conditions?: string | null
          pdf_footer_text?: string | null
          primary_color?: string
          secondary_color?: string | null
          signer_email?: string | null
          signer_name?: string | null
          signer_phone?: string | null
          signer_role?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ai_tone?: string | null
          company_about?: string | null
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          company_site?: string | null
          company_whatsapp?: string | null
          id?: string
          logo_url?: string | null
          organization_id?: string
          pdf_default_conditions?: string | null
          pdf_footer_text?: string | null
          primary_color?: string
          secondary_color?: string | null
          signer_email?: string | null
          signer_name?: string | null
          signer_phone?: string | null
          signer_role?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      content_library: {
        Row: {
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          organization_id: string
          title: string
          type: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id?: string
          title: string
          type: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id?: string
          title?: string
          type?: string
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
            foreignKeyName: "content_library_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          connected_at: string | null
          id: string
          organization_id: string
          provider: string
          refresh_token: string
          updated_at: string | null
        }
        Insert: {
          connected_at?: string | null
          id?: string
          organization_id?: string
          provider: string
          refresh_token: string
          updated_at?: string | null
        }
        Update: {
          connected_at?: string | null
          id?: string
          organization_id?: string
          provider?: string
          refresh_token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
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
          active: boolean
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          product_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string
          product_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_table_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      price_table_item: {
        Row: {
          active: boolean
          created_at: string | null
          id: string
          maximum_quantity: number | null
          minimum_quantity: number
          price_table_id: string
          sort_order: number
          unit_price: number
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          id?: string
          maximum_quantity?: number | null
          minimum_quantity?: number
          price_table_id: string
          sort_order?: number
          unit_price: number
        }
        Update: {
          active?: boolean
          created_at?: string | null
          id?: string
          maximum_quantity?: number | null
          minimum_quantity?: number
          price_table_id?: string
          sort_order?: number
          unit_price?: number
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
          active: boolean
          billing_frequency: string | null
          calculation_type: string | null
          category: string | null
          commercial_conditions: string | null
          created_at: string | null
          default_price_table_id: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          slug: string
          sort_order: number
          unit_label: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          billing_frequency?: string | null
          calculation_type?: string | null
          category?: string | null
          commercial_conditions?: string | null
          created_at?: string | null
          default_price_table_id?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string
          slug: string
          sort_order?: number
          unit_label?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          billing_frequency?: string | null
          calculation_type?: string | null
          category?: string | null
          commercial_conditions?: string | null
          created_at?: string | null
          default_price_table_id?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          sort_order?: number
          unit_label?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      product_benefit: {
        Row: {
          active: boolean
          id: string
          product_id: string
          sort_order: number
          title: string
        }
        Insert: {
          active?: boolean
          id?: string
          product_id: string
          sort_order?: number
          title: string
        }
        Update: {
          active?: boolean
          id?: string
          product_id?: string
          sort_order?: number
          title?: string
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
          active: boolean
          id: string
          product_id: string
          sort_order: number
          title: string
        }
        Insert: {
          active?: boolean
          id?: string
          product_id: string
          sort_order?: number
          title: string
        }
        Update: {
          active?: boolean
          id?: string
          product_id?: string
          sort_order?: number
          title?: string
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
          active: boolean
          answer: string
          id: string
          product_id: string
          question: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          answer: string
          id?: string
          product_id: string
          question: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          answer?: string
          id?: string
          product_id?: string
          question?: string
          sort_order?: number
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
          active: boolean
          id: string
          product_id: string
          sort_order: number
          title: string
        }
        Insert: {
          active?: boolean
          id?: string
          product_id: string
          sort_order?: number
          title: string
        }
        Update: {
          active?: boolean
          id?: string
          product_id?: string
          sort_order?: number
          title?: string
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
          active: boolean
          created_at: string | null
          full_name: string | null
          id: string
          job_title: string | null
          organization_id: string
          phone: string | null
          role: string
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          organization_id: string
          phone?: string | null
          role?: string
        }
        Update: {
          active?: boolean
          created_at?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          organization_id?: string
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal: {
        Row: {
          archived_at: string | null
          client_id: string | null
          code: number
          commercial_conditions: string | null
          commercial_notes: string | null
          created_at: string | null
          created_by: string | null
          diagnosis: string | null
          discount_percent: number | null
          discount_value: number | null
          followup_days: number
          forma_pagamento: string | null
          has_pending_review: boolean | null
          id: string
          is_archived: boolean
          lost_comment: string | null
          lost_reason: string | null
          objectives: string | null
          opportunity_status: string
          organization_id: string
          prazo_implantacao: string | null
          public_token: string | null
          sent_at: string | null
          status: string
          template_id: string | null
          title: string
          total_amount: number | null
          total_monthly: number | null
          total_setup: number | null
          updated_at: string | null
          validade_dias: number
          version: number
          version_group: string | null
          vigencia_contrato: string | null
        }
        Insert: {
          archived_at?: string | null
          client_id?: string | null
          code: number
          commercial_conditions?: string | null
          commercial_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          diagnosis?: string | null
          discount_percent?: number | null
          discount_value?: number | null
          followup_days?: number
          forma_pagamento?: string | null
          has_pending_review?: boolean | null
          id?: string
          is_archived?: boolean
          lost_comment?: string | null
          lost_reason?: string | null
          objectives?: string | null
          opportunity_status?: string
          organization_id?: string
          prazo_implantacao?: string | null
          public_token?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          title?: string
          total_amount?: number | null
          total_monthly?: number | null
          total_setup?: number | null
          updated_at?: string | null
          validade_dias?: number
          version?: number
          version_group?: string | null
          vigencia_contrato?: string | null
        }
        Update: {
          archived_at?: string | null
          client_id?: string | null
          code?: number
          commercial_conditions?: string | null
          commercial_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          diagnosis?: string | null
          discount_percent?: number | null
          discount_value?: number | null
          followup_days?: number
          forma_pagamento?: string | null
          has_pending_review?: boolean | null
          id?: string
          is_archived?: boolean
          lost_comment?: string | null
          lost_reason?: string | null
          objectives?: string | null
          opportunity_status?: string
          organization_id?: string
          prazo_implantacao?: string | null
          public_token?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          title?: string
          total_amount?: number | null
          total_monthly?: number | null
          total_setup?: number | null
          updated_at?: string | null
          validade_dias?: number
          version?: number
          version_group?: string | null
          vigencia_contrato?: string | null
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
            foreignKeyName: "proposal_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "proposal_template"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          proposal_id: string
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          proposal_id: string
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          proposal_id?: string
          session_id?: string | null
          user_agent?: string | null
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
          content_json: Json
          created_at: string | null
          enabled: boolean
          id: string
          proposal_id: string
          sort_order: number
          title: string | null
          type: string
        }
        Insert: {
          content_json: Json
          created_at?: string | null
          enabled?: boolean
          id?: string
          proposal_id: string
          sort_order?: number
          title?: string | null
          type: string
        }
        Update: {
          content_json?: Json
          created_at?: string | null
          enabled?: boolean
          id?: string
          proposal_id?: string
          sort_order?: number
          title?: string | null
          type?: string
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
          created_at: string | null
          created_by: string | null
          event_type: string
          id: string
          metadata: Json | null
          proposal_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          proposal_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_event_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_event_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposal"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_product: {
        Row: {
          created_at: string | null
          discount_percent: number | null
          discount_value: number | null
          id: string
          manual_override: boolean
          monthly_value: number | null
          notes: string | null
          override_reason: string | null
          pricing_type: string
          product_id: string | null
          proposal_id: string
          quantity: number
          setup_value: number | null
          snapshot: Json
          sort_order: number
          subtotal: number | null
          unit_value: number | null
        }
        Insert: {
          created_at?: string | null
          discount_percent?: number | null
          discount_value?: number | null
          id?: string
          manual_override?: boolean
          monthly_value?: number | null
          notes?: string | null
          override_reason?: string | null
          pricing_type?: string
          product_id?: string | null
          proposal_id: string
          quantity?: number
          setup_value?: number | null
          snapshot: Json
          sort_order?: number
          subtotal?: number | null
          unit_value?: number | null
        }
        Update: {
          created_at?: string | null
          discount_percent?: number | null
          discount_value?: number | null
          id?: string
          manual_override?: boolean
          monthly_value?: number | null
          notes?: string | null
          override_reason?: string | null
          pricing_type?: string
          product_id?: string | null
          proposal_id?: string
          quantity?: number
          setup_value?: number | null
          snapshot?: Json
          sort_order?: number
          subtotal?: number | null
          unit_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_product_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_product_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposal"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_template: {
        Row: {
          accent_color: string | null
          background_color: string | null
          base_font_size: number | null
          cover_image_url: string | null
          cover_text_color: string | null
          cover_video_url: string | null
          created_at: string | null
          custom_css: string | null
          default_font: string | null
          description: string | null
          heading_bold: boolean | null
          heading_color: string | null
          heading_size: number | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          product_slugs: string[]
          slug: string | null
          text_color: string | null
          text_line_height: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          base_font_size?: number | null
          cover_image_url?: string | null
          cover_text_color?: string | null
          cover_video_url?: string | null
          created_at?: string | null
          custom_css?: string | null
          default_font?: string | null
          description?: string | null
          heading_bold?: boolean | null
          heading_color?: string | null
          heading_size?: number | null
          id?: string
          is_default?: boolean
          name: string
          organization_id?: string
          product_slugs: string[]
          slug?: string | null
          text_color?: string | null
          text_line_height?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          base_font_size?: number | null
          cover_image_url?: string | null
          cover_text_color?: string | null
          cover_video_url?: string | null
          created_at?: string | null
          custom_css?: string | null
          default_font?: string | null
          description?: string | null
          heading_bold?: boolean | null
          heading_color?: string | null
          heading_size?: number | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          product_slugs?: string[]
          slug?: string | null
          text_color?: string | null
          text_line_height?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_template_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      template_block: {
        Row: {
          created_at: string | null
          default_content: Json
          enabled: boolean
          id: string
          sort_order: number
          template_id: string
          title: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          default_content: Json
          enabled?: boolean
          id?: string
          sort_order?: number
          template_id: string
          title?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          default_content?: Json
          enabled?: boolean
          id?: string
          sort_order?: number
          template_id?: string
          title?: string | null
          type?: string
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
        Args: never
        Returns: {
          active: boolean
          count: number
          created_at: string
          email: string
          full_name: string
          id: string
          job_title: string
          last_sign_in_at: string
          phone: string
          role: string
        }[]
      }
      current_org_id: { Args: never; Returns: string }
      is_org_admin: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

