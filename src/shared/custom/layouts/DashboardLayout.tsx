import type { ReactNode } from 'react';
import { Header } from '../components';
import { AppSidebar } from '../components';
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
} from '@/shared/shadcn/components';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <Header />
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
