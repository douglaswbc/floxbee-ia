import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';

export type AutomationRule = Tables<'automation_rules'>;
export type AutomationRuleInsert = TablesInsert<'automation_rules'>;
export type AutomationRuleUpdate = TablesUpdate<'automation_rules'>;
export type AutomationLog = Tables<'automation_logs'>;

// Trigger types
export type TriggerType = 
  | 'keyword'           // Matches keywords in message
  | 'new_contact'       // New contact created
  | 'first_message'     // First message from contact
  | 'no_response'       // No response after X minutes
  | 'business_hours'    // Outside business hours
  | 'ticket_created'    // When ticket is created
  | 'birthday';         // Contact birthday

export interface TriggerConfig {
  type: TriggerType;
  keywords?: string[];
  delay_minutes?: number;
  business_hours?: {
    start: string; // "08:00"
    end: string;   // "18:00"
    days: number[]; // 0-6, Sunday = 0
  };
}

export interface AutomationRuleWithTemplate extends AutomationRule {
  template?: {
    id: string;
    nome: string;
    conteudo: string;
  } | null;
}

export const TRIGGER_TYPES: { value: TriggerType; label: string; description: string }[] = [
  { value: 'keyword', label: 'Palavra-chave', description: 'Responde quando mensagem contém palavras específicas' },
  { value: 'new_contact', label: 'Novo contato', description: 'Quando um novo contato é criado' },
  { value: 'first_message', label: 'Primeira mensagem', description: 'Primeira mensagem de um contato' },
  { value: 'no_response', label: 'Sem resposta', description: 'Após X minutos sem resposta do agente' },
  { value: 'business_hours', label: 'Fora do horário', description: 'Mensagens fora do horário comercial' },
  { value: 'ticket_created', label: 'Ticket criado', description: 'Quando um ticket é criado automaticamente' },
  { value: 'birthday', label: 'Aniversário', description: 'Envia mensagem no dia do aniversário do contato' },
];

export const useAutomations = () => {
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading, error } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select(`
          *,
          template:message_templates(id, nome, conteudo)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AutomationRuleWithTemplate[];
    },
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['automation-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_logs')
        .select(`
          *,
          contact:contacts(id, nome, whatsapp),
          rule:automation_rules(id, nome)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const createRule = useMutation({
    mutationFn: async (rule: {
      nome: string;
      tipo: string;
      trigger_config: TriggerConfig;
      mensagem?: string;
      template_id?: string;
      ativo?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('automation_rules')
        .insert({
          nome: rule.nome,
          tipo: rule.tipo,
          trigger_config: rule.trigger_config as unknown as Json,
          mensagem: rule.mensagem,
          template_id: rule.template_id,
          ativo: rule.ativo ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...rule }: {
      id: string;
      nome?: string;
      tipo?: string;
      trigger_config?: TriggerConfig;
      mensagem?: string;
      template_id?: string | null;
      ativo?: boolean;
    }) => {
      const updateData: Record<string, unknown> = {};
      
      if (rule.nome !== undefined) updateData.nome = rule.nome;
      if (rule.tipo !== undefined) updateData.tipo = rule.tipo;
      if (rule.trigger_config !== undefined) updateData.trigger_config = rule.trigger_config;
      if (rule.mensagem !== undefined) updateData.mensagem = rule.mensagem;
      if (rule.template_id !== undefined) updateData.template_id = rule.template_id;
      if (rule.ativo !== undefined) updateData.ativo = rule.ativo;

      const { data, error } = await supabase
        .from('automation_rules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });

  const toggleRuleStatus = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('automation_rules')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });

  return {
    rules,
    logs,
    isLoading,
    logsLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleStatus,
  };
};
