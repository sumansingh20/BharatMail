import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { mailApi } from '../services/api';

interface SearchFilters {
  from: string;
  to: string;
  subject: string;
  hasWords: string;
  doesntHave: string;
  hasAttachment: boolean;
  dateWithin: string;
  olderThan: string;
  newerThan: string;
  size: string;
  sizeComparison: 'greater' | 'less';
  folder: string;
  isRead: string;
  isStarred: string;
}

interface SearchResult {
  id: string;
  from: { email: string; name?: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  bodyText?: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  threadId: string;
  folder: string;
}

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState('');
  const [totalResults, setTotalResults] = useState(0);

  const [filters, setFilters] = useState<SearchFilters>({
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    subject: searchParams.get('subject') || '',
    hasWords: searchParams.get('q') || '',
    doesntHave: '',
    hasAttachment: false,
    dateWithin: '',
    olderThan: '',
    newerThan: '',
    size: '',
    sizeComparison: 'greater',
    folder: 'all',
    isRead: 'all',
    isStarred: 'all',
  });

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query?: string) => {
    setIsLoading(true);
    setError('');

    try {
      const searchQuery = query || buildSearchQuery();
      const response = await mailApi.search(searchQuery, {
        folder: filters.folder === 'all' ? undefined : filters.folder,
      });
      setResults(response.emails || []);
      setTotalResults(response.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const buildSearchQuery = () => {
    const queryParts: string[] = [];

    if (filters.hasWords) queryParts.push(filters.hasWords);
    if (filters.from) queryParts.push(`from:${filters.from}`);
    if (filters.to) queryParts.push(`to:${filters.to}`);
    if (filters.subject) queryParts.push(`subject:${filters.subject}`);
    if (filters.doesntHave) queryParts.push(`-${filters.doesntHave}`);
    if (filters.hasAttachment) queryParts.push('has:attachment');
    if (filters.isStarred === 'starred') queryParts.push('is:starred');
    if (filters.isRead === 'read') queryParts.push('is:read');
    if (filters.isRead === 'unread') queryParts.push('is:unread');

    return queryParts.join(' ');
  };

  const handleSearch = () => {
    const query = buildSearchQuery();
    navigate(`/search?q=${encodeURIComponent(query)}`);
    performSearch(query);
  };

  const handleAdvancedSearch = () => {
    handleSearch();
    setShowAdvanced(false);
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/inbox')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Back to inbox"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex-1 flex items-center space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={filters.hasWords}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasWords: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search BhaMail..."
                />
              </div>
              
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Advanced
              </button>
              
              <button
                onClick={handleSearch}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Search Panel */}
      {showAdvanced && (
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Search</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="email"
                  value={filters.from}
                  onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="From email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="email"
                  value={filters.to}
                  onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="To email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={filters.subject}
                  onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Subject contains"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doesn't have</label>
                <input
                  type="text"
                  value={filters.doesntHave}
                  onChange={(e) => setFilters(prev => ({ ...prev, doesntHave: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Words to exclude"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
                <select
                  value={filters.folder}
                  onChange={(e) => setFilters(prev => ({ ...prev, folder: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Mail</option>
                  <option value="inbox">Inbox</option>
                  <option value="sent">Sent</option>
                  <option value="drafts">Drafts</option>
                  <option value="spam">Spam</option>
                  <option value="trash">Trash</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Read Status</label>
                <select
                  value={filters.isRead}
                  onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="read">Read</option>
                  <option value="unread">Unread</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasAttachment}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasAttachment: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Has attachment</span>
              </label>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Starred:</label>
                <select
                  value={filters.isStarred}
                  onChange={(e) => setFilters(prev => ({ ...prev, isStarred: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="starred">Starred</option>
                  <option value="unstarred">Not starred</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowAdvanced(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdvancedSearch}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Results Header */}
            {results.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  {totalResults.toLocaleString()} results for "{filters.hasWords || 'advanced search'}"
                </p>
              </div>
            )}
            
            {/* Results List */}
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm">Try different search terms or check your spelling</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {results.map((email) => (
                  <div
                    key={email.id}
                    className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                      !email.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => navigate(`/thread/${email.threadId}`)}
                  >
                    <button
                      className={`mr-4 p-1 ${
                        email.isStarred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
                      }`}
                      title={email.isStarred ? 'Remove star' : 'Add star'}
                    >
                      <svg className="w-5 h-5" fill={email.isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>

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
                        <span className="ml-auto text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}