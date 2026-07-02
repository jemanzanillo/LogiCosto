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
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_profile_id: string
          created_at: string
          detail: Json | null
          document_id: string | null
          id: string
          org_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_profile_id: string
          created_at?: string
          detail?: Json | null
          document_id?: string | null
          id?: string
          org_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_profile_id?: string
          created_at?: string
          detail?: Json | null
          document_id?: string | null
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_notes: {
        Row: {
          contenido: string
          created_at: string
          created_by: string
          document_id: string
          id: string
          org_id: string
        }
        Insert: {
          contenido: string
          created_at?: string
          created_by: string
          document_id: string
          id?: string
          org_id: string
        }
        Update: {
          contenido?: string
          created_at?: string
          created_by?: string
          document_id?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_notes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          created_at: string
          created_by: string
          data: Json
          document_id: string
          id: string
          nota: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          data: Json
          document_id: string
          id?: string
          nota?: string | null
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string
          data?: Json
          document_id?: string
          id?: string
          nota?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string
          current_version_id: string | null
          id: string
          importador_id: string | null
          importador_nombre: string
          importador_rnc: string
          internal_notes: string | null
          org_id: string
          origen: Database["public"]["Enums"]["document_origen"]
          status: Database["public"]["Enums"]["document_status"]
          tipo: Database["public"]["Enums"]["document_tipo"]
          updated_at: string
          vencimiento_parqueo: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          current_version_id?: string | null
          id?: string
          importador_id?: string | null
          importador_nombre: string
          importador_rnc: string
          internal_notes?: string | null
          org_id: string
          origen?: Database["public"]["Enums"]["document_origen"]
          status?: Database["public"]["Enums"]["document_status"]
          tipo: Database["public"]["Enums"]["document_tipo"]
          updated_at?: string
          vencimiento_parqueo?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          current_version_id?: string | null
          id?: string
          importador_id?: string | null
          importador_nombre?: string
          importador_rnc?: string
          internal_notes?: string | null
          org_id?: string
          origen?: Database["public"]["Enums"]["document_origen"]
          status?: Database["public"]["Enums"]["document_status"]
          tipo?: Database["public"]["Enums"]["document_tipo"]
          updated_at?: string
          vencimiento_parqueo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_importador_id_fkey"
            columns: ["importador_id"]
            isOneToOne: false
            referencedRelation: "importadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_current_version"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      importadores: {
        Row: {
          created_at: string
          created_by: string
          id: string
          nombre: string
          org_id: string
          rnc: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          nombre: string
          org_id: string
          rnc: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          nombre?: string
          org_id?: string
          rnc?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "importadores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "importadores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_colors: Json | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          brand_colors?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          brand_colors?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          org_id: string
          role: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          org_id: string
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          org_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          allowed: boolean
          org_id: string
          role: string
          updated_at: string
        }
        Insert: {
          action: string
          allowed?: boolean
          org_id: string
          role: string
          updated_at?: string
        }
        Update: {
          action?: string
          allowed?: boolean
          org_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      soporte_tickets: {
        Row: {
          asunto: string
          categoria: string | null
          created_at: string
          created_by: string
          estado: string
          id: string
          mensaje: string
          org_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          asunto: string
          categoria?: string | null
          created_at?: string
          created_by: string
          estado?: string
          id?: string
          mensaje: string
          org_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          asunto?: string
          categoria?: string | null
          created_at?: string
          created_by?: string
          estado?: string
          id?: string
          mensaje?: string
          org_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soporte_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soporte_tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soporte_tickets_updated_by_fkey"
            columns: ["updated_by"]
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
      my_org_id: { Args: never; Returns: string }
    }
    Enums: {
      audit_action:
        | "crear"
        | "editar"
        | "revisar"
        | "exportar"
        | "finalizar"
        | "importar"
        | "eliminar"
        | "preset_crear"
        | "preset_editar"
        | "nota_crear"
        | "nota_eliminar"
      document_origen: "app" | "respaldo_offline" | "historico"
      document_status: "borrador" | "exportada" | "finalizada"
      document_tipo: "vehiculo" | "contenedor"
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
      audit_action: [
        "crear",
        "editar",
        "revisar",
        "exportar",
        "finalizar",
        "importar",
        "eliminar",
        "preset_crear",
        "preset_editar",
        "nota_crear",
        "nota_eliminar",
      ],
      document_origen: ["app", "respaldo_offline", "historico"],
      document_status: ["borrador", "exportada", "finalizada"],
      document_tipo: ["vehiculo", "contenedor"],
    },
  },
} as const
