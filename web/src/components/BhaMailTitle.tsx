import { useEffect } from 'react';

interface BhaMailTitleProps {
  title?: string;
  unreadCount?: number;
}

export function BhaMailTitle({ title = "Inbox", unreadCount }: BhaMailTitleProps) {
  useEffect(() => {
    const baseTitle = "BhaMail";
    let fullTitle = baseTitle;
    
    if (title && title !== "Inbox") {
      fullTitle = `${title} - ${baseTitle}`;
    }
    
    if (unreadCount && unreadCount > 0) {
      fullTitle = `(${unreadCount}) ${fullTitle}`;
    }
    
    document.title = fullTitle;
    
    return () => {
      document.title = baseTitle;
    };
  }, [title, unreadCount]);

  return null;
}