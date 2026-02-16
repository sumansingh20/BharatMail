import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Inbox, Star, Send, FileText, Trash2, 
  AlertTriangle, Clock, Mail, Calendar, Users,
  FolderOpen, Plus, Settings,
  Video,
  Globe, Image, ChevronDown, ChevronRight
} from 'lucide-react';
import { BhaMailLogo } from './BhaMailLogo';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function BhaMailSidebar({ isCollapsed = false }: SidebarProps) {
  const location = useLocation();
  const [showGoogleServices, setShowGoogleServices] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const mailItems = [
    { icon: Inbox, label: 'Inbox', path: '/inbox', count: 12 },
    { icon: Star, label: 'Starred', path: '/starred' },
    { icon: Clock, label: 'Snoozed', path: '/snoozed' },
    { icon: Send, label: 'Sent', path: '/sent' },
    { icon: FileText, label: 'Drafts', path: '/drafts', count: 3 },
    { icon: Mail, label: 'All Mail', path: '/all' },
    { icon: AlertTriangle, label: 'Spam', path: '/spam' },
    { icon: Trash2, label: 'Trash', path: '/trash' },
  ];

  const googleServices = [
    { icon: Calendar, label: 'Calendar', path: '/calendar', external: false },
    { icon: Users, label: 'Contacts', path: '/contacts', external: false },
    { icon: FolderOpen, label: 'Drive', path: '/drive', external: false },
    { icon: Video, label: 'Meet', path: 'https://meet.google.com', external: true },
    { icon: Globe, label: 'Search', path: 'https://google.com', external: true },
    { icon: Image, label: 'Photos', path: 'https://photos.google.com', external: true },
  ];

  const customLabels = [
    { name: 'Work', color: 'bg-red-500', count: 5 },
    { name: 'Personal', color: 'bg-blue-500', count: 8 },
    { name: 'Finance', color: 'bg-green-500', count: 2 },
    { name: 'Travel', color: 'bg-purple-500', count: 1 },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ icon: Icon, label, path, count, external = false }: any) => {
    const content = (
      <>
        <Icon className="h-4 w-4 min-w-4" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            {count && count > 0 && (
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                {count}
              </span>
            )}
          </>
        )}
      </>
    );

    const className = `
      flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm font-medium
      transition-all duration-200 group
      ${isActive(path) 
        ? 'bg-red-50 text-red-700 border-l-4 border-red-500' 
        : 'text-gray-700 hover:bg-gray-100'
      }
      ${isCollapsed ? 'justify-center' : ''}
    `;

    if (external) {
      return (
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          title={isCollapsed ? label : undefined}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        to={path}
        className={className}
        title={isCollapsed ? label : undefined}
      >
        {content}
      </Link>
    );
  };

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center p-4 border-b border-gray-100">
          {isCollapsed ? (
            <BhaMailLogo size="sm" showText={false} />
          ) : (
            <BhaMailLogo size="md" showText={true} />
          )}
        </div>

        {/* Compose Button */}
        <div className="p-4">
          <Link
            to="/compose"
            className={`
              flex items-center justify-center gap-2 
              bg-gradient-to-r from-blue-600 to-blue-700 
              text-white font-medium rounded-full
              transition-all duration-200 hover:shadow-lg
              ${isCollapsed ? 'w-12 h-12' : 'w-full py-3 px-6'}
            `}
          >
            <Plus className="h-5 w-5" />
            {!isCollapsed && <span>Compose</span>}
          </Link>
        </div>

        {/* Mail Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-1">
            {mailItems.map((item) => (
              <NavItem key={item.path} {...item} />
            ))}
          </nav>

          {/* Google Services Section */}
          <div className="mt-6">
            <button
              onClick={() => setShowGoogleServices(!showGoogleServices)}
              className={`
                flex items-center gap-2 px-3 py-2 mx-2 text-sm font-medium text-gray-600
                hover:bg-gray-100 rounded-lg transition-colors w-full
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              {showGoogleServices ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {!isCollapsed && <span>Google Services</span>}
            </button>

            {showGoogleServices && (
              <div className="mt-1 space-y-1">
                {googleServices.map((service) => (
                  <NavItem key={service.path} {...service} />
                ))}
              </div>
            )}
          </div>

          {/* Labels Section */}
          <div className="mt-6">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`
                flex items-center gap-2 px-3 py-2 mx-2 text-sm font-medium text-gray-600
                hover:bg-gray-100 rounded-lg transition-colors w-full
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              {showLabels ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {!isCollapsed && <span>Labels</span>}
            </button>

            {showLabels && !isCollapsed && (
              <div className="mt-1 space-y-1">
                {customLabels.map((label) => (
                  <Link
                    key={label.name}
                    to={`/label/${label.name.toLowerCase()}`}
                    className="flex items-center gap-3 px-3 py-2 mx-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className={`w-3 h-3 rounded-full ${label.color}`} />
                    <span className="flex-1">{label.name}</span>
                    {label.count > 0 && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {label.count}
                      </span>
                    )}
                  </Link>
                ))}
                
                <Link
                  to="/labels"
                  className="flex items-center gap-3 px-3 py-2 mx-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Create label</span>
                </Link>
                
                <Link
                  to="/labels"
                  className="flex items-center gap-3 px-3 py-2 mx-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="h-3 w-3" />
                  <span>Manage labels</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center justify-between">
            {!isCollapsed ? (
              <>
                <span className="text-xs text-gray-500">
                  15 GB of 15 GB used
                </span>
                <Link
                  to="/settings"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <Link
                to="/settings"
                className="text-gray-400 hover:text-gray-600 transition-colors mx-auto"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
            )}
          </div>
          
          {!isCollapsed && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div className="bg-blue-600 h-1 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}