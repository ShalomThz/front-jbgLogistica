import type { ReactNode } from 'react';
import { Header } from '../components';
import { AppSidebar } from '../components';
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
} from '@contexts/shared/shadcn/components';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider className="h-screen !min-h-0 overflow-hidden">
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset className="flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
