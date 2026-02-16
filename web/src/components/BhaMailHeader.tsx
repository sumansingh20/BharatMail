import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Settings, HelpCircle, Grid3X3, Menu, 
  User, LogOut, Calendar, Users, FolderOpen,
  Video, Image, Globe, Mail, ChevronDown
} from 'lucide-react';
import { BhaMailLogo } from './BhaMailLogo';
import { useAuthStore } from '../stores/auth';

interface HeaderProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function BhaMailHeader({ onToggleSidebar, showSidebarToggle = true }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const googleApps = [
    { 
      name: 'BhaMail', 
      icon: Mail, 
      path: '/inbox', 
      color: 'text-red-500',
      external: false 
    },
    { 
      name: 'Calendar', 
      icon: Calendar, 
      path: '/calendar', 
      color: 'text-blue-500',
      external: false 
    },
    { 
      name: 'Contacts', 
      icon: Users, 
      path: '/contacts', 
      color: 'text-green-500',
      external: false 
    },
    { 
      name: 'Drive', 
      icon: FolderOpen, 
      path: '/drive', 
      color: 'text-yellow-500',
      external: false 
    },
    { 
      name: 'Meet', 
      icon: Video, 
      path: 'https://meet.google.com', 
      color: 'text-orange-500',
      external: true 
    },
    { 
      name: 'Photos', 
      icon: Image, 
      path: 'https://photos.google.com', 
      color: 'text-purple-500',
      external: true 
    },
    { 
      name: 'Search', 
      icon: Globe, 
      path: 'https://google.com', 
      color: 'text-blue-600',
      external: true 
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const AppIcon = ({ app }: { app: typeof googleApps[0] }) => {
    const content = (
      <div className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 transition-colors group">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-white transition-colors">
          <app.icon className={`h-6 w-6 ${app.color}`} />
        </div>
        <span className="text-xs text-gray-700 font-medium">{app.name}</span>
      </div>
    );

    if (app.external) {
      return (
        <a
          href={app.path}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {content}
        </a>
      );
    }

    return (
      <Link to={app.path} className="block" onClick={() => setShowAppsMenu(false)}>
        {content}
      </Link>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 relative z-50">
      <div className="flex items-center flex-1">
        {/* Sidebar Toggle */}
        {showSidebarToggle && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mr-3"
            title="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Logo */}
        <Link to="/inbox" className="flex items-center mr-6">
          <BhaMailLogo size="md" showText={true} />
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search mail"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-2 
                  bg-gray-100 hover:bg-white hover:shadow-md
                  border border-transparent hover:border-gray-300
                  rounded-full transition-all duration-200
                  focus:outline-none focus:bg-white focus:shadow-md focus:border-blue-500
                  text-sm
                "
              />
            </div>
          </form>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2">
        {/* Help */}
        <button
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Settings */}
        <Link
          to="/settings"
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>

        {/* Google Apps */}
        <div className="relative">
          <button
            onClick={() => setShowAppsMenu(!showAppsMenu)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Google apps"
          >
            <Grid3X3 className="h-5 w-5" />
          </button>

          {showAppsMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowAppsMenu(false)}
              />
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Google Apps</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {googleApps.map((app) => (
                      <AppIcon key={app.name} app={app} />
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <Link
                    to="/settings"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => setShowAppsMenu(false)}
                  >
                    More from BhaMail →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              {user?.firstName ? (
                <span className="text-white text-sm font-medium">
                  {user.firstName[0].toUpperCase()}
                </span>
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                {/* User Info */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      {user?.firstName ? (
                        <span className="text-white text-lg font-medium">
                          {user.firstName[0].toUpperCase()}
                        </span>
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <Link
                    to="/settings"
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-500">
                    Privacy Policy • Terms of Service
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}