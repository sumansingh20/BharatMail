import { BhaMailLogo } from './BhaMailLogo';

interface BhaMailLoadingProps {
  message?: string;
  fullPage?: boolean;
}

export function BhaMailLoading({ message = "Loading...", fullPage = false }: BhaMailLoadingProps) {
  const containerClass = fullPage 
    ? "min-h-screen bg-gray-50 flex flex-col justify-center items-center"
    : "flex flex-col items-center justify-center py-8";

  return (
    <div className={containerClass}>
      <div className="text-center">
        <BhaMailLogo size="lg" showText={true} />
        
        <div className="mt-8">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-gmail-blue mx-auto"></div>
          </div>
          
          <p className="mt-4 text-sm text-gray-600 font-medium">{message}</p>
          
          {fullPage && (
            <p className="mt-2 text-xs text-gray-500">
              Powered by <span className="font-medium text-gmail-blue">BhaMail</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}