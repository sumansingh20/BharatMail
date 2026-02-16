import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mailApi } from '../services/api';
import { Send, Loader } from 'lucide-react';

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
}

export function SentPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await mailApi.getInbox({ folder: 'sent' });
      setEmails(response.emails || []);
    } catch (err) {
      setError('Failed to load sent emails');
      console.error('Error loading sent emails:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Sent</h1>
          <div className="text-sm text-gray-500">
            {emails.length} {emails.length === 1 ? 'email' : 'emails'}
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-auto">
        {emails.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Send className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sent emails</h3>
            <p className="text-gray-600">
              Emails you send will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {emails.map((email) => (
              <div
                key={email.id}
                className="p-4 hover:bg-gray-50"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          To: {email.to.map(recipient => recipient.name || recipient.email).join(', ')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTimestamp(email.timestamp)}
                      </span>
                    </div>
                    <Link
                      to={`/email/${email.id}`}
                      className="block hover:underline"
                    >
                      <p className="text-sm font-medium truncate">
                        {email.subject || '(No subject)'}
                      </p>
                      {email.bodyText && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {email.bodyText.substring(0, 100)}...
                        </p>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}