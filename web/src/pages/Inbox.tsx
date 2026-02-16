import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mailApi } from '../services/api';
import { BhaMailLoading } from '../components/BhaMailLoading';
import { BhaMailErrorPage } from '../components/BhaMailErrorPage';
import { BhaMailTitle } from '../components/BhaMailTitle';
import {
  Archive,
  Trash2,
  AlertTriangle,
  Tag,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Star,
  Circle,
  Paperclip,
  Clock,
  Eye,
  EyeOff,
  Download,
  Printer,
  Filter
} from 'lucide-react';

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
  isSnoozed: boolean;
  hasAttachments: boolean;
  threadId: string;
  labels: Array<{ name: string; color: string }>;
  category: 'primary' | 'social' | 'promotions' | 'updates' | 'forums';
}

export function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  // const [inboxType, setInboxType] = useState<'default' | 'important' | 'unread' | 'starred'>('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setIsLoading(true);
      const response = await mailApi.getInbox({ folder: 'inbox' });
      setEmails(response.emails || []);
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
    setSelectAll(newSelected.size === emails.length);
  };

  const toggleSelectAll = () => {
    if (selectedEmails.size === emails.length) {
      setSelectedEmails(new Set());
      setSelectAll(false);
    } else {
      setSelectedEmails(new Set(emails.map(email => email.id)));
      setSelectAll(true);
    }
  };

  const handleBulkAction = async (action: string) => {
    const emailIds = Array.from(selectedEmails);
    if (emailIds.length === 0) return;

    try {
      switch (action) {
        case 'archive':
          // Implement archive
          console.log('Archiving emails:', emailIds);
          break;
        case 'delete':
          // Implement delete
          console.log('Deleting emails:', emailIds);
          break;
        case 'markAsRead':
          // Implement mark as read
          console.log('Marking as read:', emailIds);
          break;
        case 'markAsUnread':
          // Implement mark as unread
          console.log('Marking as unread:', emailIds);
          break;
        case 'spam':
          // Implement mark as spam
          console.log('Marking as spam:', emailIds);
          break;
        case 'snooze':
          // Implement snooze
          console.log('Snoozing emails:', emailIds);
          break;
      }
      setSelectedEmails(new Set());
      setSelectAll(false);
    } catch (err) {
      console.error('Bulk action failed:', err);
    }
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

  const unreadCount = emails.filter(email => !email.isRead).length;

  if (isLoading) {
    return <BhaMailLoading message="Loading your emails..." />;
  }

  if (error) {
    return (
      <BhaMailErrorPage 
        title="Unable to load emails"
        message={error}
        onRefresh={loadEmails}
        showHome={false}
      />
    );
  }

  return (
    <div className="gmail-content">
      <BhaMailTitle title="Inbox" unreadCount={unreadCount} />
      {/* Gmail Toolbar */}
      <div className="gmail-toolbar">
        <div className="gmail-toolbar-left">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
            title="Select all"
          />
          
          {selectedEmails.size > 0 && (
            <>
              <button
                onClick={() => handleBulkAction('archive')}
                className="gmail-toolbar-btn"
                title="Archive"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBulkAction('spam')}
                className="gmail-toolbar-btn"
                title="Report spam"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="gmail-toolbar-btn"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBulkAction('markAsRead')}
                className="gmail-toolbar-btn"
                title="Mark as read"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBulkAction('markAsUnread')}
                className="gmail-toolbar-btn"
                title="Mark as unread"
              >
                <EyeOff className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBulkAction('snooze')}
                className="gmail-toolbar-btn"
                title="Snooze"
              >
                <Clock className="w-4 h-4" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  className="gmail-toolbar-btn"
                  title="More"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMoreActions && (
                  <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-48">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Add to Tasks
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Label as
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter messages like these
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          
          <button
            onClick={loadEmails}
            className="gmail-toolbar-btn ml-4"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="gmail-toolbar-right">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedEmails.size > 0 
                ? `${selectedEmails.size} selected` 
                : `1-${emails.length} of ${emails.length}`
              }
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="gmail-toolbar-btn"
                title="Older"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="gmail-toolbar-btn"
                title="Newer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gmail Email List */}
      <div className="gmail-email-list">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-16">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium mb-2">Your BhaMail inbox is empty</p>
            <p className="text-sm mb-4">When you receive emails, they'll appear here</p>
            <Link 
              to="/compose" 
              className="gmail-btn gmail-btn-primary"
            >
              Send your first email
            </Link>
          </div>
        ) : (
          <div>
            {emails.map((email) => (
              <div
                key={email.id}
                className={`gmail-email-item ${!email.isRead ? 'unread' : ''} ${
                  selectedEmails.has(email.id) ? 'selected' : ''
                }`}
              >
                <div className="gmail-email-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedEmails.has(email.id)}
                    onChange={() => toggleEmailSelection(email.id)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    aria-label={`Select email from ${email.from.name || email.from.email}`}
                  />
                </div>

                <button
                  onClick={() => toggleStar(email.id, email.isStarred)}
                  className={`gmail-email-star ${email.isStarred ? 'starred' : ''}`}
                  title={email.isStarred ? 'Remove star' : 'Add star'}
                  aria-label={email.isStarred ? 'Remove star' : 'Add star'}
                >
                  <Star className={`w-5 h-5 ${email.isStarred ? 'fill-current' : ''}`} />
                </button>

                {email.isImportant && (
                  <button
                    className="gmail-email-important text-yellow-400"
                    title="Important"
                    aria-label="Important email"
                  >
                    <Circle className="w-4 h-4 fill-current" />
                  </button>
                )}

                <Link 
                  to={`/thread/${email.threadId}`}
                  className="gmail-email-sender"
                >
                  {email.from.name || email.from.email}
                </Link>

                <Link 
                  to={`/thread/${email.threadId}`}
                  className="gmail-email-subject"
                >
                  <span className={!email.isRead ? 'font-bold' : ''}>
                    {email.subject || '(no subject)'}
                  </span>
                  {email.hasAttachments && (
                    <Paperclip className="w-4 h-4 inline-block ml-1 text-gray-400" />
                  )}
                  <span className="gmail-email-snippet">
                    {' - ' + (email.bodyText || '').substring(0, 100)}
                  </span>
                </Link>

                <div className="gmail-email-labels">
                  {email.labels?.map((label) => (
                    <span
                      key={label.name}
                      className={`gmail-label ${label.color}`}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>

                <div className="gmail-email-actions opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Archive email:', email.id);
                    }}
                    className="gmail-toolbar-btn"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Delete email:', email.id);
                    }}
                    className="gmail-toolbar-btn"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Mark as read/unread:', email.id);
                    }}
                    className="gmail-toolbar-btn"
                    title={email.isRead ? 'Mark as unread' : 'Mark as read'}
                  >
                    {email.isRead ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Snooze email:', email.id);
                    }}
                    className="gmail-toolbar-btn"
                    title="Snooze"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>

                <div className="gmail-email-date">
                  {formatDate(email.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}