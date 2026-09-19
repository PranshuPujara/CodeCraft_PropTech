'use client';

import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered } = useSidebar();
  const sidebarOpen = isExpanded || isHovered;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppSidebar />
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${
          sidebarOpen ? 'xl:ml-[272px]' : 'xl:ml-20'
        }`}
      >
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-dashboard animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <SidebarProvider>
          <LayoutInner>{children}</LayoutInner>
        </SidebarProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
