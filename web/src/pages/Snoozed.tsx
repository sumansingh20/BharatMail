import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mailApi } from '../services/api';

interface Email {
  id: string;
  from: { email: string; name?: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  threadId: string;
  snoozeUntil?: string;
}

export function SnoozedPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    loadSnoozedEmails();
  }, []);

  const loadSnoozedEmails = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would filter for snoozed emails
      const response = await mailApi.search('is:snoozed');
      setEmails(response.emails || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load snoozed emails');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const unsnoozeEmail = async (emailId: string) => {
    try {
      // In a real implementation, this would call an unsnooze API
      console.log('Unsnoozing email:', emailId);
      setEmails(prev => prev.filter(email => email.id !== emailId));
    } catch (err) {
      console.error('Failed to unsnooze email:', err);
    }
  };

  const formatSnoozeTime = (snoozeUntil: string) => {
    const snoozeDate = new Date(snoozeUntil);
    const now = new Date();
    
    if (snoozeDate <= now) {
      return 'Ready to show';
    }
    
    const diffTime = snoozeDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-xl font-semibold text-gray-900">Snoozed</h1>
            </div>
            <span className="text-sm text-gray-500">
              {emails.length} {emails.length === 1 ? 'email' : 'emails'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={loadSnoozedEmails}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <Link
              to="/compose"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Compose
            </Link>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-16 h-16 mb-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">No snoozed emails</p>
            <p className="text-sm">Snooze emails to deal with them later</p>
            <div className="mt-4 text-xs text-gray-400 max-w-md text-center">
              <p>💡 Tip: Use snooze to temporarily hide emails and have them reappear in your inbox at the right time</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                  !email.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center mr-4">
                  <input
                    type="checkbox"
                    checked={selectedEmails.has(email.id)}
                    onChange={() => toggleEmailSelection(email.id)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    title={`Select email from ${email.from.name || email.from.email}`}
                  />
                </div>

                <button
                  onClick={() => unsnoozeEmail(email.id)}
                  className="mr-4 p-1 text-purple-500 hover:text-purple-700"
                  title="Unsnooze email"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                <Link 
                  to={`/thread/${email.threadId}`}
                  className="flex-1 flex items-center min-w-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className={`text-sm ${!email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {email.from.name || email.from.email}
                      </span>
                      {email.hasAttachments && (
                        <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                      {email.snoozeUntil && (
                        <span className="ml-2 text-xs text-purple-600 px-2 py-1 bg-purple-100 rounded">
                          {formatSnoozeTime(email.snoozeUntil)}
                        </span>
                      )}
                    </div>
                    <div className={`text-sm ${!email.isRead ? 'font-medium text-gray-900' : 'text-gray-600'} truncate`}>
                      {email.subject || '(no subject)'}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {email.bodyText || ''}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 ml-4">
                    {formatDate(email.timestamp)}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Snooze Info Panel */}
      <div className="border-t border-gray-200 bg-purple-50 p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-purple-800">
            <p className="font-medium">About Snoozed Emails</p>
            <p className="mt-1">
              Snoozed emails are temporarily hidden from your inbox and will reappear automatically at the scheduled time. 
              You can unsnooze them manually at any time by clicking the clock icon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}