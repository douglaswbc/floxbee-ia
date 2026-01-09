import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Ticket, 
  Megaphone, 
  FileText,
  Bot,
  Sparkles,
  Settings,
  LogOut,
  Code
} from 'lucide-react';
import FloxBeeLogo from '../FloxBeeLogo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: MessageSquare, label: 'Inbox', path: '/inbox' },
  { icon: Users, label: 'Contatos', path: '/contacts' },
  { icon: Ticket, label: 'Tickets', path: '/tickets' },
  { icon: Megaphone, label: 'Campanhas', path: '/campaigns' },
  { icon: FileText, label: 'Templates', path: '/templates' },
  { icon: Bot, label: 'Automações', path: '/automations' },
  { icon: Sparkles, label: 'IA Atendimento', path: '/ai-service' },
  { icon: Code, label: 'API Docs', path: '/api-docs' },
];

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Até logo!",
      description: "Você saiu do sistema",
    });
    navigate('/auth');
  };

  return (
    <aside className="flex flex-col h-screen w-16 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-border">
        <FloxBeeLogo size={36} showText={false} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                    "hover:bg-secondary",
                    isActive && "bg-primary/10 text-primary"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "w-5 h-5",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} 
                  />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-foreground text-background">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center pb-4 gap-1 border-t border-border pt-4">
        {/* User Avatar */}
        {profile && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm mb-2">
                {profile.nome?.charAt(0).toUpperCase() || 'U'}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-foreground text-background">
              {profile.nome}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink
              to="/settings"
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                "hover:bg-secondary",
                location.pathname === '/settings' && "bg-primary/10 text-primary"
              )}
            >
              <Settings 
                className={cn(
                  "w-5 h-5",
                  location.pathname === '/settings' ? "text-primary" : "text-muted-foreground"
                )} 
              />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-foreground text-background">
            Configurações
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-foreground text-background">
            Sair
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
};

export default AppSidebar;
