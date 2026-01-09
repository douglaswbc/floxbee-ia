import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const AppLayout: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    // fixed inset-0 é a chave para evitar que o layout suba no mobile
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background fixed inset-0">
      <AppSidebar />
      <main className="flex-1 h-full overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;