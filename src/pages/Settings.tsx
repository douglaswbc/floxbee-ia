import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Users,
  Key,
  ChevronRight,
  Settings2,
  Sliders,
  Building
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FloxBeeLogo from '@/components/FloxBeeLogo';
import UserManagement from '@/components/settings/UserManagement';
import SystemPreferences from '@/components/settings/SystemPreferences';
import TenantSettings from '@/components/settings/TenantSettings';
import { useAuth } from '@/hooks/useAuth';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, profile } = useAuth();

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <FloxBeeLogo size={32} />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">Gerencie usuários, permissões e preferências do sistema</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">Preferências</span>
            </TabsTrigger>
            <TabsTrigger value="tenant" className="gap-2">
              <Building className="w-4 h-4" />
              <span className="hidden sm:inline">Sistema</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Integrações</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Meu Perfil</CardTitle>
                  <CardDescription>Suas informações pessoais</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Nome', value: profile?.nome || 'Carregando...' },
                    { label: 'Email', value: profile?.email || user?.email || 'Sem email' },
                    { label: 'Telefone', value: profile?.telefone || 'Não informado' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                  <Separator />
                  <Button variant="outline" className="w-full">Editar Perfil</Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>Proteja sua conta</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: 'Alterar Senha', icon: Key },
                    { label: 'Autenticação em duas etapas', icon: Shield },
                    { label: 'Sessões ativas', icon: Globe },
                  ].map((item) => (
                    <div 
                      key={item.label} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <SystemPreferences />
          </TabsContent>

          {/* Tenant/System Configuration Tab */}
          <TabsContent value="tenant">
            <TenantSettings />
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Integrações</CardTitle>
                  <CardDescription>Conecte com outros sistemas</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: 'WhatsApp Business API', status: 'Conectado', connected: true },
                    { label: 'OpenAI API', status: 'Conectado', connected: true },
                    { label: 'Email SMTP', status: 'Configurar', connected: false },
                    { label: 'Webhook Externo', status: 'Configurar', connected: false },
                  ].map((item) => (
                    <div 
                      key={item.label} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${item.connected ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {item.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Configurações Avançadas</CardTitle>
                  <CardDescription>Opções técnicas do sistema</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Modo de debug</p>
                      <p className="text-xs text-muted-foreground">Logs detalhados no console</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Cache de mensagens</p>
                      <p className="text-xs text-muted-foreground">Armazenamento local temporário</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Analytics</p>
                      <p className="text-xs text-muted-foreground">Coletar métricas de uso</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
