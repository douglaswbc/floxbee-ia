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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      automation_logs: {
        Row: {
          contact_id: string | null
          created_at: string
          detalhes: Json | null
          id: string
          rule_id: string | null
          status: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          rule_id?: string | null
          status: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          rule_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          ativo: boolean | null
          created_at: string
          created_by: string | null
          id: string
          mensagem: string | null
          nome: string
          template_id: string | null
          tipo: string
          trigger_config: Json
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          created_by?: string | null
          id?: string
          mensagem?: string | null
          nome: string
          template_id?: string | null
          tipo: string
          trigger_config?: Json
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          created_by?: string | null
          id?: string
          mensagem?: string | null
          nome?: string
          template_id?: string | null
          tipo?: string
          trigger_config?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          contact_id: string
          entregue_em: string | null
          enviado_em: string | null
          erro: string | null
          id: string
          lido_em: string | null
          status: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          campaign_id: string
          contact_id: string
          entregue_em?: string | null
          enviado_em?: string | null
          erro?: string | null
          id?: string
          lido_em?: string | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          entregue_em?: string | null
          enviado_em?: string | null
          erro?: string | null
          id?: string
          lido_em?: string | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          agendado_para: string | null
          concluido_em: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          entregues: number | null
          enviados: number | null
          falhas: number | null
          filtro_secretaria: string | null
          filtro_tags: string[] | null
          id: string
          iniciado_em: string | null
          lidos: number | null
          mensagem: string
          nome: string
          respondidos: number | null
          status: Database["public"]["Enums"]["campaign_status"]
          template_id: string | null
          total_destinatarios: number | null
          updated_at: string
        }
        Insert: {
          agendado_para?: string | null
          concluido_em?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          entregues?: number | null
          enviados?: number | null
          falhas?: number | null
          filtro_secretaria?: string | null
          filtro_tags?: string[] | null
          id?: string
          iniciado_em?: string | null
          lidos?: number | null
          mensagem: string
          nome: string
          respondidos?: number | null
          status?: Database["public"]["Enums"]["campaign_status"]
          template_id?: string | null
          total_destinatarios?: number | null
          updated_at?: string
        }
        Update: {
          agendado_para?: string | null
          concluido_em?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          entregues?: number | null
          enviados?: number | null
          falhas?: number | null
          filtro_secretaria?: string | null
          filtro_tags?: string[] | null
          id?: string
          iniciado_em?: string | null
          lidos?: number | null
          mensagem?: string
          nome?: string
          respondidos?: number | null
          status?: Database["public"]["Enums"]["campaign_status"]
          template_id?: string | null
          total_destinatarios?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          id: string
          last_campaign_at: string | null
          last_message_at: string | null
          matricula: string | null
          messages_sent_count: number | null
          metadata: Json | null
          nome: string
          secretaria: string | null
          tags: string[] | null
          updated_at: string
          whatsapp: string
          whatsapp_validated: boolean | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          last_campaign_at?: string | null
          last_message_at?: string | null
          matricula?: string | null
          messages_sent_count?: number | null
          metadata?: Json | null
          nome: string
          secretaria?: string | null
          tags?: string[] | null
          updated_at?: string
          whatsapp: string
          whatsapp_validated?: boolean | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          last_campaign_at?: string | null
          last_message_at?: string | null
          matricula?: string | null
          messages_sent_count?: number | null
          metadata?: Json | null
          nome?: string
          secretaria?: string | null
          tags?: string[] | null
          updated_at?: string
          whatsapp?: string
          whatsapp_validated?: boolean | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          assigned_to: string | null
          contact_id: string
          created_at: string
          id: string
          is_bot_active: boolean | null
          last_message_at: string | null
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          contact_id: string
          created_at?: string
          id?: string
          is_bot_active?: boolean | null
          last_message_at?: string | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          is_bot_active?: boolean | null
          last_message_at?: string | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          conteudo: string
          created_at: string
          created_by: string | null
          id: string
          nome: string
          updated_at: string
          variaveis: string[] | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          conteudo: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          updated_at?: string
          variaveis?: string[] | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          updated_at?: string
          variaveis?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string
          delivered_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          read_at: string | null
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["message_sender"]
          status: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["message_sender"]
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender"]
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          matricula: string | null
          must_change_password: boolean | null
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          matricula?: string | null
          must_change_password?: boolean | null
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          matricula?: string | null
          must_change_password?: boolean | null
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          assigned_to: string | null
          categoria: string | null
          contact_id: string | null
          conversation_id: string | null
          created_at: string
          descricao: string | null
          id: string
          metadata: Json | null
          numero: number
          prioridade: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          sla_deadline: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          categoria?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          metadata?: Json | null
          numero?: number
          prioridade?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          categoria?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          metadata?: Json | null
          numero?: number
          prioridade?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "agente" | "superadmin"
      campaign_status:
        | "rascunho"
        | "agendada"
        | "enviando"
        | "concluida"
        | "cancelada"
      conversation_status: "ativo" | "aguardando" | "transferido" | "resolvido"
      message_sender: "servidor" | "ia" | "agente"
      ticket_priority: "baixa" | "media" | "alta" | "urgente"
      ticket_status: "aberto_ia" | "em_analise" | "pendente" | "concluido"
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
      app_role: ["admin", "supervisor", "agente", "superadmin"],
      campaign_status: [
        "rascunho",
        "agendada",
        "enviando",
        "concluida",
        "cancelada",
      ],
      conversation_status: ["ativo", "aguardando", "transferido", "resolvido"],
      message_sender: ["servidor", "ia", "agente"],
      ticket_priority: ["baixa", "media", "alta", "urgente"],
      ticket_status: ["aberto_ia", "em_analise", "pendente", "concluido"],
    },
  },
} as const
