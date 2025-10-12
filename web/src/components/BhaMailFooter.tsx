import { BhaMailLogo } from './BhaMailLogo';

export function BhaMailFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <BhaMailLogo size="sm" showText={false} />
          <span>© 2025 BhaMail. All rights reserved.</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <a href="#" className="gmail-link">Privacy</a>
          <a href="#" className="gmail-link">Terms</a>
          <a href="#" className="gmail-link">Help</a>
          <span className="text-xs text-gray-500">
            Powered by <span className="font-medium text-gmail-blue">BhaMail</span>
          </span>
        </div>
      </div>
    </footer>
  );
}