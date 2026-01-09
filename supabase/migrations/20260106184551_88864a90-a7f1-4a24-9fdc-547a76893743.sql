-- =============================================
-- FloxBee Database Schema
-- CRM e Gestor de Atendimento Omnicanal
-- =============================================

-- 1. ENUM TYPES
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'agente');
CREATE TYPE public.ticket_status AS ENUM ('aberto_ia', 'em_analise', 'pendente', 'concluido');
CREATE TYPE public.ticket_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');
CREATE TYPE public.message_sender AS ENUM ('servidor', 'ia', 'agente');
CREATE TYPE public.campaign_status AS ENUM ('rascunho', 'agendada', 'enviando', 'concluida', 'cancelada');
CREATE TYPE public.conversation_status AS ENUM ('ativo', 'aguardando', 'transferido', 'resolvido');

-- 2. PROFILES TABLE (Atendentes/Usuários do Sistema)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. USER ROLES TABLE
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'agente',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. SECURITY DEFINER FUNCTION FOR ROLES
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. CONTACTS TABLE (Servidores)
-- =============================================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  whatsapp_validated BOOLEAN DEFAULT false,
  matricula TEXT,
  secretaria TEXT,
  cargo TEXT,
  email TEXT,
  data_nascimento DATE,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_message_at TIMESTAMPTZ,
  messages_sent_count INTEGER DEFAULT 0,
  last_campaign_at TIMESTAMPTZ
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_contacts_whatsapp ON public.contacts(whatsapp);
CREATE INDEX idx_contacts_matricula ON public.contacts(matricula);
CREATE INDEX idx_contacts_secretaria ON public.contacts(secretaria);
CREATE INDEX idx_contacts_tags ON public.contacts USING GIN(tags);

-- 6. CONVERSATIONS TABLE
-- =============================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  status conversation_status DEFAULT 'ativo' NOT NULL,
  is_bot_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  unread_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_conversations_contact ON public.conversations(contact_id);
CREATE INDEX idx_conversations_assigned ON public.conversations(assigned_to);
CREATE INDEX idx_conversations_status ON public.conversations(status);

-- 7. MESSAGES TABLE
-- =============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_type message_sender NOT NULL,
  sender_id UUID, -- profile_id if agente, null if servidor/ia
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  whatsapp_message_id TEXT,
  status TEXT DEFAULT 'sent',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  read_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 8. TICKETS TABLE (Demandas)
-- =============================================
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status ticket_status DEFAULT 'aberto_ia' NOT NULL,
  prioridade ticket_priority DEFAULT 'media' NOT NULL,
  categoria TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  resolved_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_contact ON public.tickets(contact_id);
CREATE INDEX idx_tickets_assigned ON public.tickets(assigned_to);

-- 9. MESSAGE TEMPLATES TABLE
-- =============================================
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT,
  conteudo TEXT NOT NULL,
  variaveis TEXT[] DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- 10. CAMPAIGNS TABLE
-- =============================================
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  template_id UUID REFERENCES public.message_templates(id),
  mensagem TEXT NOT NULL,
  filtro_secretaria TEXT,
  filtro_tags TEXT[] DEFAULT '{}',
  status campaign_status DEFAULT 'rascunho' NOT NULL,
  total_destinatarios INTEGER DEFAULT 0,
  enviados INTEGER DEFAULT 0,
  entregues INTEGER DEFAULT 0,
  lidos INTEGER DEFAULT 0,
  respondidos INTEGER DEFAULT 0,
  falhas INTEGER DEFAULT 0,
  agendado_para TIMESTAMPTZ,
  iniciado_em TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_campaigns_status ON public.campaigns(status);

-- 11. CAMPAIGN RECIPIENTS TABLE
-- =============================================
CREATE TABLE public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pendente',
  whatsapp_message_id TEXT,
  enviado_em TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ,
  lido_em TIMESTAMPTZ,
  erro TEXT,
  UNIQUE(campaign_id, contact_id)
);

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_campaign_recipients_campaign ON public.campaign_recipients(campaign_id);

-- 12. AUTOMATION RULES TABLE
-- =============================================
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'boas_vindas', 'aniversario', 'status_ticket', 'lembrete'
  trigger_config JSONB NOT NULL DEFAULT '{}',
  template_id UUID REFERENCES public.message_templates(id),
  mensagem TEXT,
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- 13. AUTOMATION LOGS TABLE
-- =============================================
CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  detalhes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- 14. UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. RLS POLICIES
-- =============================================

-- Profiles: Users can view all profiles, update own
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- User Roles: Only admins can manage, users can view own
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Contacts: All authenticated users can CRUD
CREATE POLICY "Authenticated users can manage contacts" ON public.contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Conversations: All authenticated users can CRUD
CREATE POLICY "Authenticated users can manage conversations" ON public.conversations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Messages: All authenticated users can CRUD
CREATE POLICY "Authenticated users can manage messages" ON public.messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tickets: All authenticated users can CRUD
CREATE POLICY "Authenticated users can manage tickets" ON public.tickets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Templates: All authenticated users can view, admins/supervisors can manage
CREATE POLICY "Authenticated users can view templates" ON public.message_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage templates" ON public.message_templates
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );

-- Campaigns: All authenticated users can view, admins/supervisors can manage
CREATE POLICY "Authenticated users can view campaigns" ON public.campaigns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage campaigns" ON public.campaigns
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );

-- Campaign Recipients
CREATE POLICY "Authenticated users can manage campaign recipients" ON public.campaign_recipients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Automation Rules: All view, admins manage
CREATE POLICY "Authenticated users can view automation rules" ON public.automation_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage automation rules" ON public.automation_rules
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Automation Logs: All can view
CREATE POLICY "Authenticated users can view automation logs" ON public.automation_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert automation logs" ON public.automation_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- 16. CREATE PROFILE ON USER SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email
  );
  
  -- Add default 'agente' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'agente');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();