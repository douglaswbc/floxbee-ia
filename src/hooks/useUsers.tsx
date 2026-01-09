import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface UserWithRole {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  avatar_url: string | null;
  ativo: boolean | null;
  created_at: string;
  role: AppRole;
  role_id: string;
}

// Roles visíveis para usuários normais (superadmin é oculto)
export const VISIBLE_ROLES: AppRole[] = ['admin', 'supervisor', 'agente'];

export const ROLE_LABELS: Record<AppRole, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  supervisor: 'Supervisor',
  agente: 'Agente',
};

export const ROLE_COLORS: Record<AppRole, string> = {
  superadmin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  supervisor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  agente: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export function useUsers() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('nome');

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles, filtering out superadmins
      const usersWithRoles: UserWithRole[] = profiles
        .map((profile) => {
          const userRole = roles.find((r) => r.user_id === profile.user_id);
          return {
            id: profile.id,
            user_id: profile.user_id,
            nome: profile.nome,
            email: profile.email,
            telefone: profile.telefone,
            avatar_url: profile.avatar_url,
            ativo: profile.ativo,
            created_at: profile.created_at,
            role: userRole?.role || 'agente',
            role_id: userRole?.id || '',
          };
        })
        // Hide superadmins from the list
        .filter((user) => user.role !== 'superadmin');

      return usersWithRoles;
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Função atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar função. Verifique suas permissões.');
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Status do usuário atualizado!');
    },
    onError: (error) => {
      console.error('Error toggling user status:', error);
      toast.error('Erro ao atualizar status do usuário.');
    },
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    supervisors: users.filter((u) => u.role === 'supervisor').length,
    agents: users.filter((u) => u.role === 'agente').length,
    active: users.filter((u) => u.ativo).length,
    inactive: users.filter((u) => !u.ativo).length,
  };

  return {
    users,
    isLoading,
    error,
    updateRole,
    toggleUserStatus,
    stats,
  };
}

export function useCurrentUserRole() {
  return useQuery({
    queryKey: ['current-user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      return role?.role || 'agente';
    },
  });
}
