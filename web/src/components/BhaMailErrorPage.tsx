import { BhaMailLogo } from './BhaMailLogo';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface BhaMailErrorPageProps {
  title?: string;
  message?: string;
  showHome?: boolean;
  showRefresh?: boolean;
  onRefresh?: () => void;
}

export function BhaMailErrorPage({ 
  title = "Something went wrong",
  message = "We're having trouble loading this page. Please try again.",
  showHome = true,
  showRefresh = true,
  onRefresh
}: BhaMailErrorPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <BhaMailLogo size="lg" showText={true} />
          <div className="mt-8 mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              {showRefresh && (
                <button
                  onClick={onRefresh}
                  className="gmail-btn gmail-btn-primary w-full flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              )}
              
              {showHome && (
                <a
                  href="/"
                  className="gmail-btn gmail-btn-secondary w-full flex items-center justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Inbox
                </a>
              )}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact{' '}
                <span className="font-medium text-gmail-blue">BhaMail Support</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}