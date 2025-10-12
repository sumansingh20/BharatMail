import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mailApi } from '../services/api';
import {
  Paperclip,
  Image,
  Link,
  Smile,
  MoreHorizontal,
  Minimize2,
  Maximize2,
  X,
  Send,
  Clock,
  Eye,
  AlertTriangle,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Trash2
} from 'lucide-react';

interface Recipient {
  email: string;
  name?: string;
}

export function ComposePage() {
  const [to, setTo] = useState<string>('');
  const [cc, setCc] = useState<string>('');
  const [bcc, setBcc] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showConfidential, setShowConfidential] = useState(false);
  const [isConfidential, setIsConfidential] = useState(false);
  const [formatting, setFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const parseRecipients = (recipientString: string): Recipient[] => {
    if (!recipientString.trim()) return [];
    
    return recipientString.split(',').map(email => ({
      email: email.trim(),
    }));
  };

  const handleSend = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const recipients = parseRecipients(to);
      const ccRecipients = parseRecipients(cc);
      const bccRecipients = parseRecipients(bcc);

      if (recipients.length === 0) {
        setError('Please enter at least one recipient');
        setIsLoading(false);
        return;
      }

      await mailApi.sendEmail({
        to: recipients,
        cc: ccRecipients.length > 0 ? ccRecipients : undefined,
        bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
        subject,
        bodyText: body,
        bodyHtml: body.replace(/\n/g, '<br>'),
      });

      setSuccess('Email sent successfully!');
      setTimeout(() => {
        navigate('/inbox');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    // TODO: Implement save draft functionality
    console.log('Save draft functionality to be implemented');
  };

  return (
    <div className={`gmail-compose-window ${isFullscreen ? 'fullscreen' : ''} ${isMinimized ? 'minimized' : ''}`}>
      {/* Compose Header */}
      <div className="gmail-compose-header">
        <span className="font-medium text-gray-900">New Message</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-200 rounded"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-gray-200 rounded"
            title={isFullscreen ? 'Default view' : 'Full screen'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/inbox')}
            className="p-1 hover:bg-gray-200 rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="gmail-compose-body">
          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recipients */}
          <div className="space-y-2 mb-4">
            {/* To Field */}
            <div className="flex items-center border-b border-gray-200 pb-2">
              <span className="w-12 text-sm text-gray-600">To</span>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipients"
                className="flex-1 px-2 py-1 text-sm border-none outline-none"
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Cc
                </button>
                <button
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Bcc
                </button>
              </div>
            </div>

            {/* Cc Field */}
            {showCcBcc && (
              <div className="flex items-center border-b border-gray-200 pb-2">
                <span className="w-12 text-sm text-gray-600">Cc</span>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Carbon copy"
                  className="flex-1 px-2 py-1 text-sm border-none outline-none"
                />
              </div>
            )}

            {/* Bcc Field */}
            {showCcBcc && (
              <div className="flex items-center border-b border-gray-200 pb-2">
                <span className="w-12 text-sm text-gray-600">Bcc</span>
                <input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="Blind carbon copy"
                  className="flex-1 px-2 py-1 text-sm border-none outline-none"
                />
              </div>
            )}

            {/* Subject Field */}
            <div className="flex items-center border-b border-gray-200 pb-2">
              <span className="w-12 text-sm text-gray-600">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="flex-1 px-2 py-1 text-sm border-none outline-none"
              />
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center space-x-1 mb-2 pb-2 border-b border-gray-200">
            <button
              onClick={() => setFormatting(prev => ({ ...prev, bold: !prev.bold }))}
              className={`p-2 rounded hover:bg-gray-100 ${formatting.bold ? 'bg-gray-200' : ''}`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFormatting(prev => ({ ...prev, italic: !prev.italic }))}
              className={`p-2 rounded hover:bg-gray-100 ${formatting.italic ? 'bg-gray-200' : ''}`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFormatting(prev => ({ ...prev, underline: !prev.underline }))}
              className={`p-2 rounded hover:bg-gray-100 ${formatting.underline ? 'bg-gray-200' : ''}`}
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button className="p-2 rounded hover:bg-gray-100" title="Align left">
              <AlignLeft className="w-4 h-4" />
            </button>
            <button className="p-2 rounded hover:bg-gray-100" title="Align center">
              <AlignCenter className="w-4 h-4" />
            </button>
            <button className="p-2 rounded hover:bg-gray-100" title="Align right">
              <AlignRight className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button className="p-2 rounded hover:bg-gray-100" title="Bulleted list">
              <List className="w-4 h-4" />
            </button>
            <button className="p-2 rounded hover:bg-gray-100" title="Numbered list">
              <ListOrdered className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button className="p-2 rounded hover:bg-gray-100" title="Insert link">
              <Link className="w-4 h-4" />
            </button>
            <button className="p-2 rounded hover:bg-gray-100" title="Insert emoji">
              <Smile className="w-4 h-4" />
            </button>
            <button className="p-2 rounded hover:bg-gray-100" title="Attach files">
              <Paperclip className="w-4 h-4" />
            </button>
            <button className="p-2 rounded hover:bg-gray-100" title="Insert photo">
              <Image className="w-4 h-4" />
            </button>
            <div className="flex-1"></div>
            <button className="p-2 rounded hover:bg-gray-100" title="More options">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Message Body */}
          <div className="flex-1 min-h-96">
            <div
              ref={bodyRef}
              contentEditable
              className="w-full h-full p-3 text-sm leading-relaxed outline-none"
              style={{
                minHeight: '240px',
                fontFamily: 'arial, sans-serif',
              }}
              onInput={(e) => setBody(e.currentTarget.textContent || '')}
              suppressContentEditableWarning={true}
            />
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSend}
                disabled={isLoading || !to.trim()}
                className="gmail-btn gmail-btn-primary flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{isLoading ? 'Sending...' : 'Send'}</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="p-2 rounded hover:bg-gray-100"
                  title="Schedule send"
                >
                  <Clock className="w-4 h-4" />
                </button>
                {showSchedule && (
                  <div className="absolute bottom-10 left-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-3 min-w-48">
                    <p className="text-sm font-medium mb-2">Schedule send</p>
                    <div className="space-y-2">
                      <button className="w-full text-left text-sm hover:bg-gray-100 p-2 rounded">Tomorrow 8:00 AM</button>
                      <button className="w-full text-left text-sm hover:bg-gray-100 p-2 rounded">Monday 9:00 AM</button>
                      <button className="w-full text-left text-sm hover:bg-gray-100 p-2 rounded">Pick date & time</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowConfidential(!showConfidential)}
                  className={`p-2 rounded hover:bg-gray-100 ${isConfidential ? 'bg-red-50 text-red-600' : ''}`}
                  title="Confidential mode"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {showConfidential && (
                  <div className="absolute bottom-10 left-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-3 min-w-64">
                    <p className="text-sm font-medium mb-2">Confidential mode</p>
                    <p className="text-xs text-gray-600 mb-3">Recipients won't have the option to forward, copy, print, or download this email.</p>
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        checked={isConfidential}
                        onChange={(e) => setIsConfidential(e.target.checked)}
                        className="h-4 w-4 text-red-600 rounded border-gray-300"
                      />
                      <span className="text-sm">Turn on confidential mode</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveDraft}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Save draft
              </button>
              <button
                onClick={() => navigate('/inbox')}
                className="p-2 rounded hover:bg-gray-100"
                title="Discard draft"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}