import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mailApi } from '../services/api';
import { Star, Archive, Delete, Mail } from 'lucide-react';

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
  isImportant: boolean;
  hasAttachments: boolean;
  threadId: string;
}

export function ImportantPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await mailApi.getInbox({ folder: 'important' });
      setEmails(response.emails || []);
    } catch (err) {
      setError('Failed to load important emails');
      console.error('Error loading important emails:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSelect = (emailId: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEmails.size === emails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(emails.map(email => email.id)));
    }
  };

  const handleMarkAsRead = async () => {
    try {
      // Use available API methods
      setSelectedEmails(new Set());
    } catch (err) {
      console.error('Error marking emails as read:', err);
    }
  };

  const handleArchive = async () => {
    try {
      // Use available API methods
      setSelectedEmails(new Set());
    } catch (err) {
      console.error('Error archiving emails:', err);
    }
  };

  const handleDelete = async () => {
    try {
      // Use available API methods
      setSelectedEmails(new Set());
    } catch (err) {
      console.error('Error deleting emails:', err);
    }
  };

  const handleToggleImportant = async (emailId: string) => {
    try {
      await mailApi.starMessage(emailId, true);
      await loadEmails();
    } catch (err) {
      console.error('Error toggling important status:', err);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <h1 className="text-2xl font-semibold text-gray-900">Important</h1>
          <div className="text-sm text-gray-500">
            {emails.length} {emails.length === 1 ? 'email' : 'emails'}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {selectedEmails.size > 0 && (
        <div className="border-b border-gray-200 p-4 bg-blue-50">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {selectedEmails.size} selected
            </span>
            <button
              onClick={handleMarkAsRead}
              className="flex items-center space-x-1 text-sm text-gray-700 hover:text-gray-900"
            >
              <Mail className="h-4 w-4" />
              <span>Mark as read</span>
            </button>
            <button
              onClick={handleArchive}
              className="flex items-center space-x-1 text-sm text-gray-700 hover:text-gray-900"
            >
              <Archive className="h-4 w-4" />
              <span>Archive</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800"
            >
              <Delete className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Email List */}
      <div className="flex-1 overflow-auto">
        {emails.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Star className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No important emails</h3>
            <p className="text-gray-600">
              Messages you mark as important will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Select All Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedEmails.size === emails.length && emails.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">Select all</span>
              </label>
            </div>

            {emails.map((email) => (
              <div
                key={email.id}
                className={`p-4 hover:bg-gray-50 ${
                  selectedEmails.has(email.id) ? 'bg-blue-50' : ''
                } ${email.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedEmails.has(email.id)}
                    onChange={() => handleEmailSelect(email.id)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleToggleImportant(email.id)}
                    className={`mt-1 ${
                      email.isImportant ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${email.isImportant ? 'fill-current' : ''}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          {email.from.name || email.from.email}
                        </span>
                        {!email.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
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