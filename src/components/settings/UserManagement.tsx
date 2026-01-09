import React, { useState } from 'react';
import { Users, Shield, Crown, UserCheck, UserX, Search, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUsers, ROLE_LABELS, ROLE_COLORS, UserWithRole } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';
import CreateUserDialog from './CreateUserDialog';

type AppRole = Database['public']['Enums']['app_role'];

const UserManagement: React.FC = () => {
  const { users, isLoading, updateRole, toggleUserStatus, stats } = useUsers();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Apenas admins podem gerenciar usuários
  if (!isAdmin) {
    return (
      <Alert className="border-destructive/50 bg-destructive/10">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-destructive">
          Apenas usuários administradores podem gerenciar usuários do sistema.
          Entre em contato com o administrador para solicitar alterações.
        </AlertDescription>
      </Alert>
    );
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-3 h-3" />;
      case 'supervisor':
        return <Shield className="w-3 h-3" />;
      default:
        return <UserCheck className="w-3 h-3" />;
    }
  };

  const handleRoleChange = (user: UserWithRole, newRole: AppRole) => {
    updateRole.mutate({ userId: user.user_id, newRole });
  };

  const handleToggleStatus = (user: UserWithRole) => {
    toggleUserStatus.mutate({ id: user.id, ativo: !user.ativo });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Crown className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.supervisors}</p>
                <p className="text-xs text-muted-foreground">Supervisores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <UserCheck className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.agents}</p>
                <p className="text-xs text-muted-foreground">Agentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários do Sistema</CardTitle>
              <CardDescription>Gerencie usuários e suas permissões</CardDescription>
            </div>
            <CreateUserDialog />
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filtrar por função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas funções</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="agente">Agente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    user.ativo ? 'bg-card hover:bg-secondary/50' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{user.nome}</p>
                        {!user.ativo && (
                          <Badge variant="secondary" className="text-xs">
                            <UserX className="w-3 h-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email || 'Sem email'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Role Badge */}
                    <Badge className={`${ROLE_COLORS[user.role]} flex items-center gap-1`}>
                      {getRoleIcon(user.role)}
                      {ROLE_LABELS[user.role]}
                    </Badge>

                    {/* Role Selector */}
                    <Select
                      value={user.role}
                      onValueChange={(value: AppRole) => handleRoleChange(user, value)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="agente">Agente</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Ativo</span>
                      <Switch
                        checked={user.ativo ?? false}
                        onCheckedChange={() => handleToggleStatus(user)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
