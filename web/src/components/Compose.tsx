import { useState, useRef, useEffect } from 'react';
import {
  X, Minimize2, Maximize2, Paperclip, Send, Clock, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Link, Smile, Image, MoreHorizontal, Trash2, Eye,
  ChevronDown, FileText, Archive,
  AlertCircle, Info, Star, Tag
} from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
}

interface Recipient {
  email: string;
  name?: string;
  type: 'to' | 'cc' | 'bcc';
}

interface ComposeData {
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  subject: string;
  body: string;
  attachments: Attachment[];
  priority: 'low' | 'normal' | 'high';
  sendLater?: Date;
  confidential: boolean;
  signature: boolean;
}

interface ComposeProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: ComposeData) => void;
  onSaveDraft: (data: ComposeData) => void;
  replyTo?: any;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function Compose({
  isOpen,
  onClose,
  onSend,
  onSaveDraft,
  replyTo,
  isMinimized = false,
  onToggleMinimize
}: ComposeProps) {
  const [composeData, setComposeData] = useState<ComposeData>({
    to: [],
    cc: [],
    bcc: [],
    subject: replyTo ? `Re: ${replyTo.subject}` : '',
    body: '',
    attachments: [],
    priority: 'normal',
    confidential: false,
    signature: true
  });

  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFormatting, setActiveFormatting] = useState<string[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (composeData.body || composeData.subject || composeData.to.length > 0) {
        setAutoSaveStatus('saving');
        onSaveDraft(composeData);
        setTimeout(() => setAutoSaveStatus('saved'), 1000);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [composeData, onSaveDraft]);

  const handleRecipientAdd = (type: 'to' | 'cc' | 'bcc', email: string) => {
    const newRecipient: Recipient = { email, type };
    setComposeData(prev => ({
      ...prev,
      [type]: [...prev[type], newRecipient]
    }));
  };

  const handleRecipientRemove = (type: 'to' | 'cc' | 'bcc', index: number) => {
    setComposeData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleAttachment = (files: FileList) => {
    Array.from(files).forEach(file => {
      const attachment: Attachment = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      };
      
      setComposeData(prev => ({
        ...prev,
        attachments: [...prev.attachments, attachment]
      }));
    });
  };

  const removeAttachment = (id: string) => {
    setComposeData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== id)
    }));
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    
    // Update active formatting
    const isActive = document.queryCommandState(command);
    setActiveFormatting(prev => {
      if (isActive && !prev.includes(command)) {
        return [...prev, command];
      } else if (!isActive && prev.includes(command)) {
        return prev.filter(cmd => cmd !== command);
      }
      return prev;
    });
  };

  const handleSend = async () => {
    if (!composeData.to.length) {
      alert('Please add at least one recipient');
      return;
    }

    setIsSending(true);
    try {
      await onSend(composeData);
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleScheduleSend = (date: Date) => {
    setComposeData(prev => ({ ...prev, sendLater: date }));
    setShowSchedule(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed ${isMinimized ? 'bottom-0 right-4 w-80 h-12' : isFullscreen ? 'inset-0 z-50' : 'bottom-0 right-4 w-96 h-[600px]'} bg-white border border-gray-300 shadow-2xl rounded-t-lg overflow-hidden transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-100 border-b border-gray-300 px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">
            {replyTo ? 'Reply' : 'New BhaMail'}
          </h3>
          {autoSaveStatus && (
            <span className={`text-xs ${
              autoSaveStatus === 'saving' ? 'text-blue-600' :
              autoSaveStatus === 'saved' ? 'text-green-600' : 'text-red-600'
            }`}>
              {autoSaveStatus === 'saving' ? 'Saving...' :
               autoSaveStatus === 'saved' ? 'Saved' : 'Error saving'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-full">
          {/* Recipients */}
          <div className="border-b border-gray-200 p-4 space-y-2">
            {/* To Field */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 w-12">To</label>
              <div className="flex-1 flex items-center gap-1 flex-wrap border-b border-gray-200 pb-1">
                {composeData.to.map((recipient, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                  >
                    {recipient.email}
                    <button
                      onClick={() => handleRecipientRemove('to', index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  placeholder="Recipients"
                  className="flex-1 min-w-32 outline-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const email = e.currentTarget.value.trim();
                      if (email) {
                        handleRecipientAdd('to', email);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => setShowCc(!showCc)}
                  className="text-blue-600 hover:underline"
                >
                  Cc
                </button>
                <button
                  onClick={() => setShowBcc(!showBcc)}
                  className="text-blue-600 hover:underline"
                >
                  Bcc
                </button>
              </div>
            </div>

            {/* CC Field */}
            {showCc && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 w-12">Cc</label>
                <div className="flex-1 flex items-center gap-1 flex-wrap border-b border-gray-200 pb-1">
                  {composeData.cc.map((recipient, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                    >
                      {recipient.email}
                      <button
                        onClick={() => handleRecipientRemove('cc', index)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="email"
                    placeholder="Carbon copy"
                    className="flex-1 min-w-32 outline-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const email = e.currentTarget.value.trim();
                        if (email) {
                          handleRecipientAdd('cc', email);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* BCC Field */}
            {showBcc && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 w-12">Bcc</label>
                <div className="flex-1 flex items-center gap-1 flex-wrap border-b border-gray-200 pb-1">
                  {composeData.bcc.map((recipient, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm"
                    >
                      {recipient.email}
                      <button
                        onClick={() => handleRecipientRemove('bcc', index)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="email"
                    placeholder="Blind carbon copy"
                    className="flex-1 min-w-32 outline-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const email = e.currentTarget.value.trim();
                        if (email) {
                          handleRecipientAdd('bcc', email);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 w-12">Subject</label>
              <input
                type="text"
                value={composeData.subject}
                onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Subject"
                className="flex-1 outline-none text-sm border-b border-gray-200 pb-1"
              />
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="border-b border-gray-200 p-2">
            <div className="flex items-center gap-1 flex-wrap">
              {/* Text Formatting */}
              <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
                <button
                  onClick={() => formatText('bold')}
                  className={`p-1 rounded hover:bg-gray-100 ${activeFormatting.includes('bold') ? 'bg-blue-100 text-blue-600' : ''}`}
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  onClick={() => formatText('italic')}
                  className={`p-1 rounded hover:bg-gray-100 ${activeFormatting.includes('italic') ? 'bg-blue-100 text-blue-600' : ''}`}
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  onClick={() => formatText('underline')}
                  className={`p-1 rounded hover:bg-gray-100 ${activeFormatting.includes('underline') ? 'bg-blue-100 text-blue-600' : ''}`}
                >
                  <Underline className="h-4 w-4" />
                </button>
              </div>

              {/* Alignment */}
              <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
                <button
                  onClick={() => formatText('justifyLeft')}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <AlignLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => formatText('justifyCenter')}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <AlignCenter className="h-4 w-4" />
                </button>
                <button
                  onClick={() => formatText('justifyRight')}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <AlignRight className="h-4 w-4" />
                </button>
              </div>

              {/* Insert Options */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => formatText('createLink', prompt('Enter URL:') || '')}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <Link className="h-4 w-4" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button className="p-1 rounded hover:bg-gray-100">
                  <Smile className="h-4 w-4" />
                </button>
                <button className="p-1 rounded hover:bg-gray-100">
                  <Image className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Message Body */}
          <div className="flex-1 p-4">
            <div
              ref={bodyRef}
              contentEditable
              className="w-full h-full outline-none text-sm leading-relaxed"
              style={{ minHeight: '200px' }}
              onInput={(e) => {
                setComposeData(prev => ({ ...prev, body: e.currentTarget.innerHTML }));
              }}
              onKeyDown={(e) => {
                // Handle keyboard shortcuts
                if (e.ctrlKey || e.metaKey) {
                  switch (e.key) {
                    case 'b':
                      e.preventDefault();
                      formatText('bold');
                      break;
                    case 'i':
                      e.preventDefault();
                      formatText('italic');
                      break;
                    case 'u':
                      e.preventDefault();
                      formatText('underline');
                      break;
                    case 'Enter':
                      e.preventDefault();
                      handleSend();
                      break;
                  }
                }
              }}
              data-placeholder="Compose your message..."
              dangerouslySetInnerHTML={{ __html: composeData.body }}
            />
          </div>

          {/* Attachments */}
          {composeData.attachments.length > 0 && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Paperclip className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Attachments</span>
              </div>
              <div className="space-y-2">
                {composeData.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">{attachment.name}</div>
                        <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="p-1 text-gray-500 hover:text-red-600 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer with Actions */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Send Button */}
                <div className="relative">
                  <button
                    onClick={handleSend}
                    disabled={isSending}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                  >
                    <Send className="h-4 w-4" />
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                  
                  {/* Send Later Dropdown */}
                  <button
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="absolute right-0 top-0 h-full px-2 bg-blue-700 text-white rounded-r hover:bg-blue-800 border-l border-blue-500"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {showSchedule && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 p-4 w-64">
                      <h4 className="text-sm font-medium mb-2">Schedule send</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleScheduleSend(new Date(Date.now() + 60 * 60 * 1000))}
                          className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                        >
                          Tomorrow morning (8:00 AM)
                        </button>
                        <button
                          onClick={() => handleScheduleSend(new Date(Date.now() + 24 * 60 * 60 * 1000))}
                          className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                        >
                          Tomorrow afternoon (1:00 PM)
                        </button>
                        <button
                          onClick={() => handleScheduleSend(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
                          className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                        >
                          Next Monday (9:00 AM)
                        </button>
                        <input
                          type="datetime-local"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          min={new Date().toISOString().slice(0, 16)}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleScheduleSend(new Date(e.target.value));
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Format Button */}
                <button className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm">
                  <span>A</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {/* Attach Files */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded"
                  title="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                {/* Insert Link */}
                <button
                  onClick={() => formatText('createLink', prompt('Enter URL:') || '')}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded"
                  title="Insert link"
                >
                  <Link className="h-4 w-4" />
                </button>

                {/* Insert Emoji */}
                <button className="p-2 text-gray-600 hover:text-gray-800 rounded" title="Insert emoji">
                  <Smile className="h-4 w-4" />
                </button>

                {/* BhaDrive */}
                <button className="p-2 text-gray-600 hover:text-gray-800 rounded" title="Insert files using BhaDrive">
                  <Archive className="h-4 w-4" />
                </button>

                {/* Insert Photo */}
                <button className="p-2 text-gray-600 hover:text-gray-800 rounded" title="Insert photo">
                  <Image className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* More Options */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className="p-2 text-gray-600 hover:text-gray-800 rounded"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  
                  {showMoreOptions && (
                    <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-300 rounded shadow-lg z-10 w-48">
                      <div className="p-2 space-y-1">
                        <button className="flex items-center gap-2 w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">
                          <Star className="h-4 w-4" />
                          Add to Tasks
                        </button>
                        <button className="flex items-center gap-2 w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">
                          <Tag className="h-4 w-4" />
                          Label
                        </button>
                        <button className="flex items-center gap-2 w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">
                          <Eye className="h-4 w-4" />
                          Confidential mode
                        </button>
                        <hr className="my-1" />
                        <div className="px-2 py-1">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={composeData.signature}
                              onChange={(e) => setComposeData(prev => ({ ...prev, signature: e.target.checked }))}
                              className="h-3 w-3"
                            />
                            Include signature
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delete Draft */}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:text-red-600 rounded"
                  title="Discard draft"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Priority and Confidential Indicators */}
            {(composeData.priority !== 'normal' || composeData.confidential || composeData.sendLater) && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                {composeData.priority === 'high' && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    High priority
                  </span>
                )}
                {composeData.priority === 'low' && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Info className="h-3 w-3" />
                    Low priority
                  </span>
                )}
                {composeData.confidential && (
                  <span className="flex items-center gap-1 text-orange-600">
                    <Eye className="h-3 w-3" />
                    Confidential mode
                  </span>
                )}
                {composeData.sendLater && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Clock className="h-3 w-3" />
                    Scheduled for {composeData.sendLater.toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleAttachment(e.target.files);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}