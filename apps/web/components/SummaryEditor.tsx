'use client'

import { useState, useEffect, useCallback } from 'react'
import { Edit3, Save, ArrowLeft, CheckCircle, GitCompare, X } from 'lucide-react'
import { useAppStore, SummaryData } from '@/store/appStore'
import { MarkdownRenderer } from './MarkdownRenderer'
import { ExportButton } from './ExportButton'
import { DiffViewer } from './DiffViewer'
import API_ENDPOINTS from '@/config/api'

interface SummaryEditorProps {
  summary: SummaryData
  onEdited: () => void
  onBack: () => void
  onVersionCreated?: () => void
}

export function SummaryEditor({ summary, onEdited, onBack, onVersionCreated }: SummaryEditorProps) {
  const [content, setContent] = useState(summary.content)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const [showDiff, setShowDiff] = useState(false)
  const [versionHistory, setVersionHistory] = useState<Array<{
    id: string
    content: string
    prompt: string
    createdAt: string
    version: number
  }>>([])
  const [isLoadingVersions, setIsLoadingVersions] = useState(false)
  const { updateSummary } = useAppStore()

  useEffect(() => {
    setHasChanges(content !== summary.content)
  }, [summary.id, content, summary.content])

  useEffect(() => {
    setHasChanges(content !== summary.content)
  }, [content, summary.content])

  const fetchVersionHistory = useCallback(async () => {
    try {
      setIsLoadingVersions(true)
      const response = await fetch(API_ENDPOINTS.GET_SUMMARY_VERSIONS(summary.id))
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.versions) {
          setVersionHistory(result.versions)
        }
      }
    } catch (err) {
      console.error('Failed to fetch version history:', err)
    } finally {
      setIsLoadingVersions(false)
    }
  }, [summary.id])

  useEffect(() => {
    if (summary.id) {
      fetchVersionHistory()
    }
  }, [summary.id, fetchVersionHistory])

  const getPreviousVersionContent = (versionNumber: number): string => {
    if (versionNumber <= 0) return ''
    
    const previousVersion = versionHistory.find(v => v.version === versionNumber)
    
    if (!previousVersion) {
      console.warn(`Version ${versionNumber} not found in version history`)
      return ''
    }
    
    return previousVersion.content || ''
  }

  const handleSave = async () => {
    if (!hasChanges) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_SUMMARY(summary.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          prompt: summary.originalPrompt
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save changes')
      }

      const result = await response.json()
      
      updateSummary(summary.id, {
        content: content.trim(),
        version: result.summary.version,
        updatedAt: new Date(result.summary.updatedAt)
      })

      setIsEditing(false)
      setHasChanges(false)

      setSuccessMessage('Changes saved successfully!')
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)

      if (onVersionCreated && typeof onVersionCreated === 'function') {
        onVersionCreated()
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setContent(summary.content)
    setIsEditing(false)
    setHasChanges(false)
    setError(null)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-dark-400 hover:text-neon-500 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Generation</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-dark-400">
            Version {summary.version}
          </span>
          <div className="w-2 h-2 bg-neon-500 rounded-full"></div>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-neon-500/20 rounded-full mb-4">
          <Edit3 className="w-8 h-8 text-neon-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Edit & Review Summary
        </h3>
        <p className="text-dark-300">
          Make any necessary adjustments to your AI-generated summary
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="summary-content" className="block text-sm font-medium text-white">
            Summary Content
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-dark-400">
              {wordCount} words
            </span>
            {!isEditing ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center space-x-1 text-sm text-neon-500 hover:text-neon-400 transition-colors"
                >
                  <Edit3 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (!showDiff) {
                      fetchVersionHistory()
                    }
                    setShowDiff(!showDiff)
                  }}
                  disabled={summary.version === 1}
                  className={`inline-flex items-center space-x-1 text-sm transition-colors ${
                    showDiff ? 'text-green-400' : 'text-dark-400 hover:text-neon-500'
                  } ${summary.version === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={summary.version === 1 ? 'No previous version to compare with' : 'Show changes from previous version'}
                >
                  <GitCompare className="w-4 h-4 text-neon-500" />
                  <span>{showDiff ? 'Hide Diff' : 'Show Diff'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center space-x-1 text-sm text-dark-400 hover:text-white transition-colors"
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className={`
                    inline-flex items-center space-x-1 text-sm text-neon-500 hover:text-neon-400 transition-colors
                    ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {showDiff && summary.version > 1 ? (
          <div className="mb-4">
            {versionHistory.length > 0 ? (
              <DiffViewer
                currentContent={content}
                previousContent={getPreviousVersionContent(summary.version - 1)}
                showDiff={showDiff}
                onToggleDiff={() => setShowDiff(false)}
              />
            ) : (
              <div className="bg-dark-800/50 rounded-lg border border-dark-600 overflow-hidden mb-4">
                <div className="flex items-center justify-between p-3 bg-dark-700/50 border-b border-dark-600">
                  <div className="flex items-center space-x-2">
                    <GitCompare className="w-4 h-4 text-neon-500" />
                    <span className="text-sm font-medium text-white">
                      {isLoadingVersions ? 'Loading Version History...' : 'No Previous Version Found'}
                    </span>
                  </div>
                </div>
                <div className="p-4 text-center text-dark-300">
                  <p>{isLoadingVersions ? 'Loading version history to show diff...' : 'Unable to find the previous version for comparison.'}</p>
                </div>
              </div>
            )}
          </div>
        ) : showDiff && summary.version === 1 ? (
          <div className="bg-dark-800/50 rounded-lg border border-dark-600 overflow-hidden mb-4">
            <div className="flex items-center justify-between p-3 bg-dark-700/50 border-b border-dark-600">
              <div className="flex items-center space-x-2">
                <GitCompare className="w-4 h-4 text-neon-500" />
                <span className="text-sm font-medium text-white">
                  Version {summary.version} (First Version)
                </span>
              </div>
            </div>
            <div className="p-4 text-center text-dark-300">
              <p>This is the first version. No previous version to compare with.</p>
            </div>
          </div>
        ) : null}

        <div className="bg-dark-900/50 rounded-lg border border-dark-600 p-4">
          {isEditing ? (
            <textarea
              id="summary-content"
              value={content}
              onChange={handleContentChange}
              className="w-full h-96 bg-transparent text-white placeholder-dark-400 resize-none focus:outline-none focus:ring-0"
              placeholder="Your AI-generated summary will appear here..."
              disabled={isSaving}
            />
          ) : (
            <div className="h-96 overflow-y-auto">
              <MarkdownRenderer content={content} />
            </div>
          )}
        </div>
      </div>

      <div className="bg-dark-800/50 rounded-lg p-4 mb-6 border border-dark-600">
        <h4 className="font-medium text-white mb-3">Summary Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-dark-400">Original Prompt:</span>
            <p className="text-white mt-1">{summary.originalPrompt}</p>
          </div>
          <div>
            <span className="text-dark-400">Created:</span>
            <p className="text-white mt-1">
              {summary.createdAt.toLocaleDateString()} at {summary.createdAt.toLocaleTimeString()}
            </p>
          </div>
          <div>
            <span className="text-dark-400">Last Updated:</span>
            <p className="text-white mt-1">
              {summary.updatedAt.toLocaleDateString()} at {summary.updatedAt.toLocaleTimeString()}
            </p>
          </div>
          <div>
            <span className="text-dark-400">Current Version:</span>
            <p className="text-white mt-1">v{summary.version}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="btn-secondary"
        >
          Back
        </button>
        
        <div className="flex items-center space-x-3">
          <ExportButton content={summary.content} />
          
          {hasChanges && (
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Unsaved changes</span>
            </div>
          )}
          
          <button
            onClick={() => onEdited()}
            disabled={isEditing && hasChanges}
            className={`
              btn-primary
              ${isEditing && hasChanges ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Continue to Sharing
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-300">{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}