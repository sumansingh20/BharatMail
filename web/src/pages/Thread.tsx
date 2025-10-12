import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mailApi } from '../services/api';

interface Message {
  id: string;
  from: { email: string; name?: string };
  to: Array<{ email: string; name?: string }>;
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  timestamp: string;
  isRead: boolean;
  isImportant?: boolean;
  isStarred?: boolean;
  labels?: string[];
  attachments?: Array<{
    id: string;
    filename: string;
    size: number;
    contentType: string;
  }>;
}

interface Thread {
  id: string;
  subject: string;
  messages: Message[];
  participants: Array<{ email: string; name?: string }>;
  isImportant?: boolean;
  isStarred?: boolean;
  labels?: string[];
}

export function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const [thread, setThread] = useState<Thread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [replyToMessage, setReplyToMessage] = useState<string | null>(null);
  const [replyMode, setReplyMode] = useState<'reply' | 'reply-all' | 'forward' | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [showQuotedText, setShowQuotedText] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (threadId) {
      loadThread(threadId);
    }
  }, [threadId]);

  useEffect(() => {
    // Auto-expand the latest message by default
    if (thread && thread.messages.length > 0) {
      const latestMessage = thread.messages[thread.messages.length - 1];
      setExpandedMessages(new Set([latestMessage.id]));
    }
  }, [thread]);

  const loadThread = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await mailApi.getThread(id);
      setThread(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load thread');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const toggleQuotedText = (messageId: string) => {
    setShowQuotedText(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleReply = async (mode: 'reply' | 'reply-all' | 'forward') => {
    if (!thread || !replyBody.trim()) return;

    try {
      const targetMessage = replyToMessage 
        ? thread.messages.find(m => m.id === replyToMessage)
        : thread.messages[thread.messages.length - 1];
      
      if (!targetMessage) return;

      let recipients: Array<{ email: string; name?: string }> = [];
      let subject = thread.subject;

      switch (mode) {
        case 'reply':
          recipients = [targetMessage.from];
          subject = subject.startsWith('Re: ') ? subject : `Re: ${subject}`;
          break;
        case 'reply-all':
          recipients = [
            targetMessage.from,
            ...targetMessage.to,
            ...(targetMessage.cc || [])
          ].filter((recipient, index, self) => 
            index === self.findIndex(r => r.email === recipient.email)
          );
          subject = subject.startsWith('Re: ') ? subject : `Re: ${subject}`;
          break;
        case 'forward':
          subject = subject.startsWith('Fwd: ') ? subject : `Fwd: ${subject}`;
          break;
      }

      await mailApi.sendEmail({
        to: recipients,
        subject,
        bodyText: replyBody,
        bodyHtml: replyBody.replace(/\n/g, '<br>'),
        threadId: thread.id,
        replyToMessageId: targetMessage.id,
      });

      setReplyMode(null);
      setReplyToMessage(null);
      setReplyBody('');
      // Reload thread to show the new message
      await loadThread(thread.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    }
  };

  const archiveThread = async () => {
    if (!thread) return;
    try {
      await mailApi.archiveThread(thread.id);
      navigate('/inbox');
    } catch (err) {
      setError('Failed to archive thread');
    }
  };

  const deleteThread = async () => {
    if (!thread) return;
    try {
      await mailApi.deleteThread(thread.id);
      navigate('/inbox');
    } catch (err) {
      setError('Failed to delete thread');
    }
  };

  const markAsSpam = async () => {
    if (!thread) return;
    try {
      await mailApi.markThreadAsSpam(thread.id);
      navigate('/inbox');
    } catch (err) {
      setError('Failed to mark as spam');
    }
  };

  const toggleStar = async () => {
    if (!thread) return;
    try {
      await mailApi.toggleThreadStar(thread.id);
      setThread(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
    } catch (err) {
      setError('Failed to update star');
    }
  };

  const toggleImportant = async () => {
    if (!thread) return;
    try {
      await mailApi.toggleThreadImportant(thread.id);
      setThread(prev => prev ? { ...prev, isImportant: !prev.isImportant } : null);
    } catch (err) {
      setError('Failed to update importance');
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatFullDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMessagePreview = (message: Message) => {
    const text = message.bodyText || message.bodyHtml?.replace(/<[^>]*>/g, '') || '';
    return text.substring(0, 100) + (text.length > 100 ? '...' : '');
  };

  const splitQuotedContent = (content: string) => {
    // Simple quoted content detection
    const lines = content.split('\n');
    const quotedStart = lines.findIndex(line => 
      line.includes('On ') && line.includes('wrote:') ||
      line.startsWith('>') ||
      line.includes('-----Original Message-----')
    );
    
    if (quotedStart === -1) {
      return { main: content, quoted: '' };
    }
    
    return {
      main: lines.slice(0, quotedStart).join('\n').trim(),
      quoted: lines.slice(quotedStart).join('\n').trim()
    };
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
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">Thread not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Gmail Header Toolbar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/inbox')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              title="Back to inbox"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button onClick={archiveThread} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Archive">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
              </svg>
            </button>
            
            <button onClick={markAsSpam} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Report spam">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </button>
            
            <button onClick={deleteThread} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Delete">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            <div className="w-px h-6 bg-gray-300"></div>
            
            <button 
              onClick={toggleImportant} 
              className={`p-2 rounded-full ${thread.isImportant ? 'text-yellow-500' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Mark as important"
            >
              <svg className="w-5 h-5" fill={thread.isImportant ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            
            <button 
              onClick={toggleStar}
              className={`p-2 rounded-full ${thread.isStarred ? 'text-yellow-500' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Add to starred"
            >
              <svg className="w-5 h-5" fill={thread.isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {thread.messages.length} of {thread.messages.length}
            </span>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Older">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Newer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Thread Subject Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-normal text-gray-900">{thread.subject}</h1>
        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
          <span>{thread.messages.length} messages</span>
          <span>{thread.participants.length} participants</span>
          {thread.labels && thread.labels.length > 0 && (
            <div className="flex space-x-1">
              {thread.labels.map((label, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {thread.messages.map((message, index) => {
            const isExpanded = expandedMessages.has(message.id);
            const isLatest = index === thread.messages.length - 1;
            const { main, quoted } = splitQuotedContent(message.bodyText || message.bodyHtml || '');
            const showQuoted = showQuotedText.has(message.id);

            return (
              <div 
                key={message.id} 
                className={`gmail-message ${isExpanded ? 'expanded' : 'collapsed'} ${isLatest ? 'latest' : ''}`}
              >
                {/* Message Header - Always Visible */}
                <div 
                  className="message-header"
                  onClick={() => !isExpanded && toggleMessageExpansion(message.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="message-avatar">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {(message.from.name || message.from.email).charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 truncate">
                          {message.from.name || message.from.email}
                        </span>
                        {!isExpanded && (
                          <span className="text-sm text-gray-500 truncate">
                            {getMessagePreview(message)}
                          </span>
                        )}
                      </div>
                      {!isExpanded && (
                        <div className="text-xs text-gray-500">
                          to {message.to.map(r => r.name || r.email).join(', ')}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(message.timestamp)}
                      </span>
                      {message.attachments && message.attachments.length > 0 && (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                      {isExpanded && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMessageExpansion(message.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Message Content */}
                {isExpanded && (
                  <div className="message-content">
                    {/* Detailed Header */}
                    <div className="message-details">
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><strong>From:</strong> {message.from.name || message.from.email} &lt;{message.from.email}&gt;</div>
                        <div><strong>To:</strong> {message.to.map(r => `${r.name || r.email} <${r.email}>`).join(', ')}</div>
                        {message.cc && message.cc.length > 0 && (
                          <div><strong>Cc:</strong> {message.cc.map(r => `${r.name || r.email} <${r.email}>`).join(', ')}</div>
                        )}
                        <div><strong>Date:</strong> {formatFullDate(message.timestamp)}</div>
                        <div><strong>Subject:</strong> {message.subject}</div>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="message-body">
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: main || message.bodyHtml || message.bodyText?.replace(/\n/g, '<br>') || '' 
                        }}
                      />
                      
                      {/* Quoted Content */}
                      {quoted && (
                        <div className="quoted-content">
                          {!showQuoted ? (
                            <button 
                              onClick={() => toggleQuotedText(message.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                Show quoted text
                              </span>
                            </button>
                          ) : (
                            <div>
                              <button 
                                onClick={() => toggleQuotedText(message.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm mb-2"
                              >
                                <span className="flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  Hide quoted text
                                </span>
                              </button>
                              <div 
                                className="text-gray-600 text-sm border-l-2 border-gray-300 pl-4"
                                dangerouslySetInnerHTML={{ __html: quoted.replace(/\n/g, '<br>') }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="message-attachments">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          {message.attachments.length} Attachment{message.attachments.length !== 1 ? 's' : ''}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {message.attachments.map((attachment) => (
                            <div key={attachment.id} className="attachment-item">
                              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {attachment.filename}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(attachment.size)}
                                  </p>
                                </div>
                                <button className="text-blue-600 hover:text-blue-800 text-sm">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Actions */}
                    <div className="message-actions">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => {
                            setReplyToMessage(message.id);
                            setReplyMode('reply');
                          }}
                          className="inline-flex items-center px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          Reply
                        </button>
                        <button
                          onClick={() => {
                            setReplyToMessage(message.id);
                            setReplyMode('reply-all');
                          }}
                          className="inline-flex items-center px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          Reply all
                        </button>
                        <button
                          onClick={() => {
                            setReplyToMessage(message.id);
                            setReplyMode('forward');
                          }}
                          className="inline-flex items-center px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          Forward
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Reply Composer */}
      {replyMode && (
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {replyMode === 'reply' ? 'Reply' : replyMode === 'reply-all' ? 'Reply to all' : 'Forward'}
                </h3>
                <button
                  onClick={() => {
                    setReplyMode(null);
                    setReplyToMessage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="border border-gray-300 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={`Type your ${replyMode}...`}
                  className="w-full h-32 px-4 py-3 border-0 resize-none focus:outline-none rounded-lg"
                />
                
                <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setReplyMode(null);
                        setReplyToMessage(null);
                        setReplyBody('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded"
                    >
                      Discard
                    </button>
                    <button
                      onClick={() => handleReply(replyMode)}
                      disabled={!replyBody.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}