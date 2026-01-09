import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';

const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
