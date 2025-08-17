'use client'

import { useState } from 'react'
import { Mail, ArrowLeft, Send, CheckCircle, Users, MessageSquare } from 'lucide-react'
import { useAppStore, SummaryData } from '@/store/appStore'
import React from 'react'
import API_ENDPOINTS from '@/config/api'

interface EmailSharingProps {
  summary: SummaryData
  onBack: () => void
  onComplete: () => void
}

export function EmailSharing({ summary, onBack, onComplete }: EmailSharingProps) {
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [attachDocx, setAttachDocx] = useState(true)
  const [attachTxt, setAttachTxt] = useState(false)
  const [filename, setFilename] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSent, setIsSent] = useState(false)

  // Generate smart default filename when component mounts
  React.useEffect(() => {
    const lines = summary.content.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0]?.trim() || '';
      if (firstLine.startsWith('# ')) {
        setFilename(firstLine.replace(/^#\s+/, '').replace(/[^\w\s-]/g, '').trim());
      } else if (firstLine.length < 50 && /^[A-Z]/.test(firstLine)) {
        setFilename(firstLine.replace(/[^\w\s-]/g, '').trim());
      } else {
        setFilename('Meeting Summary');
      }
    } else {
      setFilename('Meeting Summary');
    }
  }, [summary.content]);

  const handleSend = async () => {
    // Validate inputs
    if (!recipientEmail.trim()) {
      setError('Please enter a recipient email')
      return
    }

    if (!filename.trim()) {
      setError('Please enter a filename')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      setError('Invalid email format')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const response = await fetch(API_ENDPOINTS.SEND_EMAIL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summaryId: summary.id,
          recipientEmail: recipientEmail.trim(),
          message: message.trim(),
          summaryContent: summary.content,
          attachDocx,
          attachTxt,
          filename: filename.trim()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      setIsSent(true)
      
      setTimeout(() => {
        onComplete()
      }, 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  if (isSent) {
    return (
      <div className="card animate-slide-up">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-neon-500/20 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-neon-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Email Sent Successfully!
          </h3>
          <p className="text-dark-300">
            Your summary has been shared with the recipients.
          </p>
        </div>
        
        <div className="bg-neon-500/10 rounded-lg p-4 mb-6 border border-neon-500/30">
          <h4 className="font-medium text-neon-400 mb-2">Email Details:</h4>
          <div className="text-sm text-neon-300 space-y-1">
            <p><strong>To:</strong> {recipientEmail}</p>
            <p><strong>Filename:</strong> {filename}</p>
            <p><strong>Attachments:</strong> {attachDocx ? 'DOCX' : ''}{attachDocx && attachTxt ? ', ' : ''}{attachTxt ? 'TXT' : ''}</p>
            <p><strong>Summary:</strong> {summary.content.slice(0, 100)}...</p>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-dark-400">
            Redirecting to start page...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-dark-400 hover:text-neon-500 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Editing</span>
        </button>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-neon-500/20 rounded-full mb-4">
          <Mail className="w-8 h-8 text-neon-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Share Your Summary
        </h3>
        <p className="text-dark-300">
          Send your AI-generated summary to team members and stakeholders
        </p>
      </div>

      {/* Recipients */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-3">
          <Users className="inline w-4 h-4 mr-1" />
          Recipients
        </label>
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Enter email address"
              className="input-field flex-1 w-full"
              disabled={isSending}
            />
          </div>
        </div>
      </div>

      {/* Filename */}
      <div className="mb-6">
        <label htmlFor="filename" className="block text-sm font-medium text-white mb-2">
          Filename
        </label>
        <input
          id="filename"
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Enter filename (e.g., Meeting Summary.docx)"
          className="input-field"
          disabled={isSending}
        />
        <p className="text-sm text-dark-400 mt-1">
          A clear filename helps recipients identify the document
        </p>
        <p className="text-xs text-dark-500 mt-1">
          Final files: {filename ? `${filename}.docx` : ''}{attachDocx && attachTxt && filename ? ', ' : ''}{filename ? `${filename}.txt` : ''}
        </p>
      </div>

      {/* Message */}
      <div className="mb-6">
        <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
          <MessageSquare className="inline w-4 h-4 mr-1" />
          Personal Message (Optional)
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a personal note or context for your team..."
          className="input-field h-24 resize-none"
          disabled={isSending}
        />
        <p className="text-sm text-dark-400 mt-1">
          This message will appear above the summary in the email
        </p>
      </div>

      {/* Summary Preview */}
      <div className="bg-dark-800/50 rounded-lg p-4 mb-6 border border-dark-600">
        <h4 className="font-medium text-white mb-3">Summary Preview</h4>
        <div className="text-sm text-dark-200 bg-dark-900/50 p-3 rounded border border-dark-600 max-h-32 overflow-y-auto">
          <div className="whitespace-pre-wrap line-clamp-4">
            {summary.content}
          </div>
        </div>
        <p className="text-xs text-dark-400 mt-2">
          Version {summary.version} • {summary.content.trim().split(/\s+/).filter(word => word.length > 0).length} words
        </p>
      </div>

      {/* Attachment Options */}
      <div className="bg-dark-800/50 rounded-lg p-4 mb-6 border border-dark-600">
        <h4 className="font-medium text-white mb-3">📎 Attachments</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="attach-docx"
              checked={attachDocx}
              onChange={(e) => setAttachDocx(e.target.checked)}
              className="w-4 h-4 text-neon-500 bg-dark-700 border-dark-600 rounded focus:ring-neon-500 focus:ring-2"
            />
            <label htmlFor="attach-docx" className="text-sm text-white">
              Attach as DOCX document
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="attach-txt"
              checked={attachTxt}
              onChange={(e) => setAttachTxt(e.target.checked)}
              className="w-4 h-4 text-neon-500 bg-dark-700 border-dark-600 rounded focus:ring-neon-500 focus:ring-2"
            />
            <label htmlFor="attach-txt" className="text-sm text-white">
              Attach as TXT file
            </label>
          </div>
        </div>
        <p className="text-xs text-dark-400 mt-2">
          Recipients will receive the summary as an attachment for easy access and sharing
        </p>
      </div>

      {/* Send Button */}
      <div className="text-center">
        <button
          onClick={handleSend}
          disabled={isSending || !recipientEmail.trim() || !filename.trim()}
          className={`
            btn-primary inline-flex items-center justify-center space-x-2 w-full sm:w-auto px-4 sm:px-6 py-3
            ${isSending || !recipientEmail.trim() || !filename.trim() 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
            }
          `}
        >
          {isSending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Summary</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
        <h4 className="font-medium text-blue-400 mb-2">💡 Sharing Tips</h4>
        <ul className="text-sm text-blue-300 space-y-1">
          <li>• Use clear, descriptive filenames for easy identification</li>
          <li>• Add a personal message for context</li>
          <li>• Consider time zones when sharing</li>
          <li>• Follow up with action items if needed</li>
        </ul>
      </div>
    </div>
  )
} 