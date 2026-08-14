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
      company_settings: {
        Row: {
          id: string
          company_name: string
          company_site: string | null
          company_email: string | null
          company_phone: string | null
          company_whatsapp: string | null
          logo_url: string | null
          cover_bg_url: string | null
          cover_video_url: string | null
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
        }
        Insert: {
          id?: string
          company_name?: string
          company_site?: string | null
          company_email?: string | null
          company_phone?: string | null
          company_whatsapp?: string | null
          logo_url?: string | null
          cover_bg_url?: string | null
          cover_video_url?: string | null
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
        }
        Update: {
          id?: string
          company_name?: string
          company_site?: string | null
          company_email?: string | null
          company_phone?: string | null
          company_whatsapp?: string | null
          logo_url?: string | null
          cover_bg_url?: string | null
          cover_video_url?: string | null
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
        }
        Relationships: []
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
          segmento: string | null
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
          segmento?: string | null
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
          segmento?: string | null
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
        ]
      }
      price_table: {
        Row: {
          active: boolean
          created_at: string | null
          description: string | null
          id: string
          name: string
          product_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          product_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
          created_at: string | null
          default_price_table_id: string | null
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          unit_label: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          billing_frequency?: string | null
          calculation_type?: string | null
          created_at?: string | null
          default_price_table_id?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          unit_label?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          billing_frequency?: string | null
          calculation_type?: string | null
          created_at?: string | null
          default_price_table_id?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          unit_label?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_default_price_table_fk"
            columns: ["default_price_table_id"]
            isOneToOne: false
            referencedRelation: "price_table"
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
          created_at: string | null
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          active: boolean
          role: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          active?: boolean
          role?: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          active?: boolean
          role?: string
        }
        Relationships: []
      }
      proposal: {
        Row: {
          client_id: string | null
          commercial_notes: string | null
          created_at: string | null
          created_by: string | null
          diagnosis: string | null
          discount_percent: number | null
          discount_value: number | null
          id: string
          objectives: string | null
          status: string
          template_id: string | null
          title: string
          total_amount: number | null
          total_monthly: number | null
          total_setup: number | null
          updated_at: string | null
          version: number
          version_group: string | null
          is_archived: boolean
          archived_at: string | null
          validade_dias: number
          forma_pagamento: string | null
          prazo_implantacao: string | null
          vigencia_contrato: string | null
        }
        Insert: {
          client_id?: string | null
          commercial_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          diagnosis?: string | null
          discount_percent?: number | null
          discount_value?: number | null
          id?: string
          objectives?: string | null
          status?: string
          template_id?: string | null
          title?: string
          total_amount?: number | null
          total_monthly?: number | null
          total_setup?: number | null
          updated_at?: string | null
          version?: number
          version_group?: string | null
          is_archived?: boolean
          archived_at?: string | null
          validade_dias?: number
          forma_pagamento?: string | null
          prazo_implantacao?: string | null
          vigencia_contrato?: string | null
        }
        Update: {
          client_id?: string | null
          commercial_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          diagnosis?: string | null
          discount_percent?: number | null
          discount_value?: number | null
          id?: string
          objectives?: string | null
          status?: string
          template_id?: string | null
          title?: string
          total_amount?: number | null
          total_monthly?: number | null
          total_setup?: number | null
          updated_at?: string | null
          version?: number
          version_group?: string | null
          is_archived?: boolean
          archived_at?: string | null
          validade_dias?: number
          forma_pagamento?: string | null
          prazo_implantacao?: string | null
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
            foreignKeyName: "proposal_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "proposal_template"
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
          content_json?: Json
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
          proposal_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_type: string
          id?: string
          proposal_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_type?: string
          id?: string
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
          snapshot?: Json
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
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean
          name: string
          slug: string | null
          product_slugs: string[]
          cover_image_url: string | null
          cover_video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          slug?: string | null
          product_slugs?: string[]
          cover_image_url?: string | null
          cover_video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          slug?: string | null
          product_slugs?: string[]
          cover_image_url?: string | null
          cover_video_url?: string | null
        }
        Relationships: []
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
          template_id: string
          type: string
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
      content_library: {
        Row: {
          id: string
          type: string
          title: string
          content: Json
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          type: string
          title: string
          content?: Json
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          title?: string
          content?: Json
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_library_created_by_fkey"
            columns: ["created_by"]
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
