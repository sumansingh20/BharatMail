import { Mail } from 'lucide-react';

interface BhaMailLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function BhaMailLogo({ size = 'md', showText = true }: BhaMailLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-16 h-16'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  return (
    <div className="flex items-center">
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg`}>
        <Mail className={`${iconSizeClasses[size]} text-white`} />
      </div>
      
      {showText && (
        <span className={`ml-3 font-medium text-gray-900 ${textSizeClasses[size]}`}>
          <span className="font-semibold text-gmail-blue">Bha</span>
          <span className="font-normal text-gray-700">Mail</span>
        </span>
      )}
    </div>
  );
}