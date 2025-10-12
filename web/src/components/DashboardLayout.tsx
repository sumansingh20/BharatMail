import { ReactNode, useState } from 'react';
import { BhaMailHeader } from './BhaMailHeader';
import { BhaMailSidebar } from './BhaMailSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function DashboardLayout({ children, showSidebar = true }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <BhaMailHeader 
        onToggleSidebar={toggleSidebar}
        showSidebarToggle={showSidebar}
      />
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <BhaMailSidebar isCollapsed={isSidebarCollapsed} />
        )}
        
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
