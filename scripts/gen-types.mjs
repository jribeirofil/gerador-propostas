// Gera src/types/database.types.ts a partir do OpenAPI vivo (/tmp/raw-schema.json)
import fs from 'node:fs'

const defs = JSON.parse(fs.readFileSync('/tmp/raw-schema.json', 'utf8'))

const TS_TYPE = {
  uuid: 'string',
  text: 'string',
  'timestamp with time zone': 'string',
  'timestamp without time zone': 'string',
  'date': 'string',
  int32: 'number',
  integer: 'number',
  'bigint': 'number',
  numeric: 'number',
  real: 'number',
  boolean: 'boolean',
  jsonb: 'Json',
  json: 'Json',
}

function tsType(prop) {
  const f = prop.format || ''
  const base = prop.type
  let t
  if (Array.isArray(base) && base[0] === 'array') {
    const inner = TS_TYPE[prop.items?.format || prop.items?.type] || 'Json'
    t = `${inner}[]`
  } else {
    t = TS_TYPE[base] || TS_TYPE[f] || 'unknown'
  }
  return t
}

function columnType(name, col, prop) {
  // Runtime check: proposal_template.product_slugs é text[] (1-D); o OpenAPI
  // reporta text[][] por artefato do PostgREST.
  if (name === 'proposal_template' && col === 'product_slugs') return 'string[]'
  return tsType(prop)
}

const TABLES = Object.entries(defs).sort(([a], [b]) => a.localeCompare(b))

let out = ''
out += `export type Json =
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
`

for (const [name, schema] of TABLES) {
  const props = Object.entries(schema.properties || {}).filter(([k]) => !k.startsWith('_'))
  const required = new Set(schema.required || [])
  const relations = []

  for (const [col, prop] of props) {
    const m = (prop.description || '').match(/<fk table='([^']+)' column='([^']+)'\/>/)
    if (m) {
      relations.push({
        foreignKeyName: `${name}_${col}_fkey`,
        columns: [col],
        isOneToOne: false,
        referencedRelation: m[1],
        referencedColumns: [m[2]],
      })
    }
  }

  const rowLines = props.map(([col, prop]) => {
    const nul = required.has(col) ? '' : ' | null'
    return `          ${col}: ${columnType(name, col, prop)}${nul}`
  })

  const insertLines = props.map(([col, prop]) => `          ${col}?: ${columnType(name, col, prop)}${required.has(col) ? '' : ' | null'}`)
  const updateLines = props.map(([col, prop]) => `          ${col}?: ${columnType(name, col, prop)}${required.has(col) ? '' : ' | null'}`)

  out += `      ${name}: {
        Row: {
${rowLines.join('\n')}
        }
        Insert: {
${insertLines.join('\n')}
        }
        Update: {
${updateLines.join('\n')}
        }
        Relationships: [
${relations.length ? relations.map(r => `          {
            foreignKeyName: "${r.foreignKeyName}"
            columns: ${JSON.stringify(r.columns)}
            isOneToOne: ${r.isOneToOne}
            referencedRelation: "${r.referencedRelation}"
            referencedColumns: ${JSON.stringify(r.referencedColumns)}
          },`).join('\n') : ''}
        ]
      }
`
}

out += `    }
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
`

// Tail helpers (mesmo formato do supabase gen types)
out += `

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
`

fs.writeFileSync('src/types/database.types.ts', out)
console.log('gerado. tabelas:', TABLES.length)
