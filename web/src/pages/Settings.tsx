import { useState } from 'react';
import { 
  Settings, User, Mail, Inbox, Shield, Filter, Ban, 
  Globe, Palette, Monitor, Bell, Forward, Key,
  Save, ChevronRight, Info, AlertCircle, CheckCircle
} from 'lucide-react';

interface GmailSettings {
  // General Settings
  language: string;
  displayDensity: 'comfortable' | 'cozy' | 'compact';
  conversationView: boolean;
  smartCompose: boolean;
  smartReply: boolean;
  rightToLeft: boolean;
  theme: 'light' | 'dark' | 'auto';
  
  // Inbox Settings
  inboxType: 'default' | 'important' | 'unread' | 'starred' | 'priority';
  inboxSections: string[];
  maxPageSize: number;
  markAsRead: 'immediately' | 'never' | 'after_3_seconds';
  
  // Account Settings
  signature: string;
  autoReply: {
    enabled: boolean;
    message: string;
    startDate: string;
    endDate: string;
    sendToKnownContacts: boolean;
  };
  forwarding: {
    enabled: boolean;
    forwardTo: string;
    keepCopy: boolean;
  };
  
  // Security Settings
  twoFactorAuth: boolean;
  sessionTimeout: number;
  allowLessSecureApps: boolean;
  
  // Filters and Labels
  filters: any[];
  blockedAddresses: string[];
  
  // Notifications
  desktopNotifications: boolean;
  emailNotifications: boolean;
  soundNotifications: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [settings, setSettings] = useState<GmailSettings>({
    language: 'en',
    displayDensity: 'comfortable',
    conversationView: true,
    smartCompose: true,
    smartReply: true,
    rightToLeft: false,
    theme: 'light',
    inboxType: 'default',
    inboxSections: ['Primary', 'Social', 'Promotions'],
    maxPageSize: 50,
    markAsRead: 'immediately',
    signature: '',
    autoReply: {
      enabled: false,
      message: '',
      startDate: '',
      endDate: '',
      sendToKnownContacts: false,
    },
    forwarding: {
      enabled: false,
      forwardTo: '',
      keepCopy: true,
    },
    twoFactorAuth: false,
    sessionTimeout: 30,
    allowLessSecureApps: false,
    filters: [],
    blockedAddresses: [],
    desktopNotifications: true,
    emailNotifications: true,
    soundNotifications: false,
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings, description: 'Language, conversation view, and display preferences' },
    { id: 'inbox', label: 'Inbox', icon: Inbox, description: 'Inbox type, categories, and reading preferences' },
    { id: 'accounts', label: 'Accounts and Import', icon: User, description: 'Account settings, signatures, and email forwarding' },
    { id: 'filters', label: 'Filters and Blocked Addresses', icon: Filter, description: 'Create filters and block unwanted emails' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Two-factor authentication and security settings' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Desktop and email notification preferences' },
  ];

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMessage('Settings saved successfully!');
    } catch (error) {
      setErrorMessage('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
    }
  };

  const updateSettings = (key: keyof GmailSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedSettings = (parent: keyof GmailSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [key]: value
      }
    }));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="h-6 w-6 text-blue-600" />
              Settings
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your BhaMail preferences and account settings
            </p>
          </div>
          
          <button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Status Messages */}
        {successMessage && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-80 border-r border-gray-200 bg-gray-50">
          <div className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{tab.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="p-6">
              <div className="max-w-4xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">General Settings</h2>
                
                <div className="space-y-8">
                  {/* Language and Display */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      Language and Display
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Language
                        </label>
                        <select
                          value={settings.language}
                          onChange={(e) => updateSettings('language', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="en">English (US)</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                          <option value="it">Italiano</option>
                          <option value="pt">Português</option>
                          <option value="zh">中文</option>
                          <option value="ja">日本語</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Density
                        </label>
                        <select
                          value={settings.displayDensity}
                          onChange={(e) => updateSettings('displayDensity', e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="comfortable">Comfortable</option>
                          <option value="cozy">Cozy</option>
                          <option value="compact">Compact</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Conversation View */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                      Email Display
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Conversation view</div>
                          <div className="text-sm text-gray-600">Group emails with their replies</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.conversationView}
                            onChange={(e) => updateSettings('conversationView', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Smart Compose</div>
                          <div className="text-sm text-gray-600">Get writing suggestions as you type</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.smartCompose}
                            onChange={(e) => updateSettings('smartCompose', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Smart Reply</div>
                          <div className="text-sm text-gray-600">Show suggested quick responses</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.smartReply}
                            onChange={(e) => updateSettings('smartReply', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Theme Settings */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Palette className="h-5 w-5 text-blue-600" />
                      Theme
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Light', description: 'Clean white theme' },
                        { value: 'dark', label: 'Dark', description: 'Dark theme for low light' },
                        { value: 'auto', label: 'Auto', description: 'Match system theme' },
                      ].map((theme) => (
                        <div
                          key={theme.value}
                          onClick={() => updateSettings('theme', theme.value as any)}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                            settings.theme === theme.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-gray-900">{theme.label}</div>
                          <div className="text-sm text-gray-600 mt-1">{theme.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inbox Settings */}
          {activeTab === 'inbox' && (
            <div className="p-6">
              <div className="max-w-4xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Inbox Settings</h2>
                
                <div className="space-y-8">
                  {/* Inbox Type */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Inbox Type</h3>
                    
                    <div className="space-y-3">
                      {[
                        { value: 'default', label: 'Default', description: 'Important messages appear in a yellow marker' },
                        { value: 'important', label: 'Important markers', description: 'No sections, but messages marked important are highlighted' },
                        { value: 'unread', label: 'Unread first', description: 'Unread messages appear first in your inbox' },
                        { value: 'starred', label: 'Starred first', description: 'Starred messages appear first in your inbox' },
                        { value: 'priority', label: 'Priority Inbox', description: 'Split inbox into sections like important, starred, etc.' },
                      ].map((type) => (
                        <label key={type.value} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="inboxType"
                            value={type.value}
                            checked={settings.inboxType === type.value}
                            onChange={(e) => updateSettings('inboxType', e.target.value as any)}
                            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{type.label}</div>
                            <div className="text-sm text-gray-600">{type.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Reading Settings */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Reading Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum page size
                        </label>
                        <select
                          value={settings.maxPageSize}
                          onChange={(e) => updateSettings('maxPageSize', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={25}>25 conversations per page</option>
                          <option value={50}>50 conversations per page</option>
                          <option value={100}>100 conversations per page</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mark as read
                        </label>
                        <select
                          value={settings.markAsRead}
                          onChange={(e) => updateSettings('markAsRead', e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="immediately">Immediately when opened</option>
                          <option value="after_3_seconds">After 3 seconds</option>
                          <option value="never">Never automatically</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Settings */}
          {activeTab === 'accounts' && (
            <div className="p-6">
              <div className="max-w-4xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Accounts and Import</h2>
                
                <div className="space-y-8">
                  {/* Signature */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Signature</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email signature
                      </label>
                      <textarea
                        value={settings.signature}
                        onChange={(e) => updateSettings('signature', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email signature..."
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        This signature will be added to all outgoing emails.
                      </p>
                    </div>
                  </div>

                  {/* Auto-Reply */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Vacation responder</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.autoReply.enabled}
                          onChange={(e) => updateNestedSettings('autoReply', 'enabled', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Vacation responder on
                        </label>
                      </div>
                      
                      {settings.autoReply.enabled && (
                        <div className="space-y-4 pl-7">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                First day
                              </label>
                              <input
                                type="date"
                                value={settings.autoReply.startDate}
                                onChange={(e) => updateNestedSettings('autoReply', 'startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last day
                              </label>
                              <input
                                type="date"
                                value={settings.autoReply.endDate}
                                onChange={(e) => updateNestedSettings('autoReply', 'endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text.sm font-medium text-gray-700 mb-2">
                              Message
                            </label>
                            <textarea
                              value={settings.autoReply.message}
                              onChange={(e) => updateNestedSettings('autoReply', 'message', e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter your vacation message..."
                            />
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={settings.autoReply.sendToKnownContacts}
                              onChange={(e) => updateNestedSettings('autoReply', 'sendToKnownContacts', e.target.checked)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label className="text-sm text-gray-700">
                              Only send to people in my contacts
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Forwarding */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Forward className="h-5 w-5 text-blue-600" />
                      Forwarding and POP/IMAP
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.forwarding.enabled}
                          onChange={(e) => updateNestedSettings('forwarding', 'enabled', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Enable forwarding
                        </label>
                      </div>
                      
                      {settings.forwarding.enabled && (
                        <div className="space-y-4 pl-7">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Forward a copy of incoming mail to
                            </label>
                            <input
                              type="email"
                              value={settings.forwarding.forwardTo}
                              onChange={(e) => updateNestedSettings('forwarding', 'forwardTo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="forwarding@example.com"
                            />
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={settings.forwarding.keepCopy}
                              onChange={(e) => updateNestedSettings('forwarding', 'keepCopy', e.target.checked)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label className="text-sm text-gray-700">
                              Keep BhaMail's copy in the Inbox
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Blocked Addresses */}
          {activeTab === 'filters' && (
            <div className="p-6">
              <div className="max-w-4xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Filters and Blocked Addresses</h2>
                
                <div className="space-y-8">
                  {/* Filters */}
                  <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                        Create a new filter
                      </button>
                    </div>
                    
                    <div className="text-center py-8 text-gray-500">
                      <Filter className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No filters created yet</p>
                      <p className="text-sm">Create filters to automatically organize your email</p>
                    </div>
                  </div>

                  {/* Blocked Addresses */}
                  <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Ban className="h-5 w-5 text-red-600" />
                        Blocked Addresses
                      </h3>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
                        Block an address
                      </button>
                    </div>
                    
                    <div className="text-center py-8 text-gray-500">
                      <Ban className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No blocked addresses</p>
                      <p className="text-sm">Block email addresses to send them directly to spam</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="p-6">
              <div className="max-w-4xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                
                <div className="space-y-8">
                  {/* Two-Factor Authentication */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Key className="h-5 w-5 text-green-600" />
                      Two-Factor Authentication
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">2-Step Verification</div>
                        <div className="text-sm text-gray-600">Add an extra layer of security to your account</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${settings.twoFactorAuth ? 'text-green-600' : 'text-gray-500'}`}>
                          {settings.twoFactorAuth ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          onClick={() => updateSettings('twoFactorAuth', !settings.twoFactorAuth)}
                          className={`px-4 py-2 rounded-md text-sm font-medium ${
                            settings.twoFactorAuth
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {settings.twoFactorAuth ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Session Settings */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-blue-600" />
                      Session Settings
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session timeout (minutes)
                        </label>
                        <select
                          value={settings.sessionTimeout}
                          onChange={(e) => updateSettings('sessionTimeout', parseInt(e.target.value))}
                          className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={180}>3 hours</option>
                          <option value={480}>8 hours</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Allow less secure apps</div>
                          <div className="text-sm text-gray-600">Allow apps that use less secure sign-in technology</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.allowLessSecureApps}
                            onChange={(e) => updateSettings('allowLessSecureApps', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="p-6">
              <div className="max-w-4xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h2>
                
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-purple-600" />
                    Notification Preferences
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Desktop notifications</div>
                        <div className="text-sm text-gray-600">Show notifications on your desktop when new mail arrives</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.desktopNotifications}
                          onChange={(e) => updateSettings('desktopNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Email notifications</div>
                        <div className="text-sm text-gray-600">Receive email notifications for important messages</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => updateSettings('emailNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Sound notifications</div>
                        <div className="text-sm text-gray-600">Play a sound when new mail arrives</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.soundNotifications}
                          onChange={(e) => updateSettings('soundNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-blue-900">Notification Settings</div>
                          <div className="text-sm text-blue-700 mt-1">
                            Browser notification permissions may need to be enabled in your browser settings.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}