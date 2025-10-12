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
  folder: string;
  labels?: string[];
}

export function AllMailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEmails, setTotalEmails] = useState(0);
  const emailsPerPage = 50;

  useEffect(() => {
    loadAllEmails();
  }, [currentPage]);

  const loadAllEmails = async () => {
    try {
      setIsLoading(true);
      // Load all emails from all folders
      const response = await mailApi.search('*', {
        page: currentPage,
        limit: emailsPerPage,
      });
      setEmails(response.emails || []);
      setTotalEmails(response.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emails');
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

  const toggleStar = async (emailId: string, isStarred: boolean) => {
    try {
      await mailApi.starMessage(emailId, !isStarred);
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isStarred: !isStarred } : email
      ));
    } catch (err) {
      console.error('Failed to toggle star:', err);
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

  const getFolderIcon = (folder: string) => {
    switch (folder) {
      case 'inbox':
        return '📥';
      case 'sent':
        return '📤';
      case 'drafts':
        return '📝';
      case 'spam':
        return '🚫';
      case 'trash':
        return '🗑️';
      default:
        return '📨';
    }
  };

  const totalPages = Math.ceil(totalEmails / emailsPerPage);

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
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h1 className="text-xl font-semibold text-gray-900">All Mail</h1>
            </div>
            <span className="text-sm text-gray-500">
              {totalEmails.toLocaleString()} {totalEmails === 1 ? 'email' : 'emails'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={loadAllEmails}
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
            <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">No emails found</p>
            <p className="text-sm">All your emails from every folder will appear here</p>
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
                  onClick={() => toggleStar(email.id, email.isStarred)}
                  className={`mr-4 p-1 ${
                    email.isStarred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
                  }`}
                  title={email.isStarred ? 'Remove star' : 'Add star'}
                >
                  <svg className="w-5 h-5" fill={email.isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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
                      <span className="ml-2 text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded flex items-center">
                        <span className="mr-1">{getFolderIcon(email.folder)}</span>
                        {email.folder}
                      </span>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-4 py-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * emailsPerPage) + 1} to {Math.min(currentPage * emailsPerPage, totalEmails)} of {totalEmails.toLocaleString()} results
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}