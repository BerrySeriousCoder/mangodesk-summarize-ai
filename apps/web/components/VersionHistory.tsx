'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, History, Clock, Edit3, Eye } from 'lucide-react'
import { SummaryData, SummaryVersion } from '@/store/appStore'
import { DiffViewer } from './DiffViewer'
import API_ENDPOINTS from '@/config/api'
import { MarkdownRenderer } from './MarkdownRenderer'

interface VersionHistoryProps {
  summaryId: string
  onVersionSelect?: (version: Version) => void
  selectedVersionId?: string
}

interface Version {
  id: string
  content: string
  prompt: string
  createdAt: string
  version: number
}

export function VersionHistory({ summaryId, onVersionSelect, selectedVersionId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [showDiff, setShowDiff] = useState(false)

  useEffect(() => {
    if (summaryId) {
      fetchVersionHistory()
    }
  }, [summaryId])

  // Sync selected version with prop
  useEffect(() => {
    if (selectedVersionId && versions.length > 0) {
      const version = versions.find(v => v.id === selectedVersionId)
      if (version) {
        setSelectedVersion(version)
      }
    }
  }, [selectedVersionId, versions])

  const fetchVersionHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(API_ENDPOINTS.GET_SUMMARY_VERSIONS(summaryId))
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch version history')
      }
      
      const data = await response.json()
      console.log('Version history response:', data)
      
      if (data.success && data.versions) {
        setVersions(data.versions)
      } else {
        setVersions([])
      }
      
    } catch (error) {
      console.error('Failed to fetch version history:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch version history')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getVersionColor = (version: number, maxVersion: number) => {
    if (version === maxVersion) return 'bg-neon-500/20 text-neon-400 border-neon-500/30'
    if (version === maxVersion - 1) return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    return 'bg-dark-700/50 text-dark-300 border-dark-600'
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-500 mx-auto mb-4"></div>
          <p className="text-dark-300">Loading version history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">
            <History size={32} className="mx-auto" />
          </div>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-dark-400 mb-4">
            <History size={32} className="mx-auto" />
          </div>
          <p className="text-dark-300">No versions found</p>
        </div>
      </div>
    )
  }

  const maxVersion = Math.max(...versions.map(v => v.version))

  return (
    <div className="card">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-neon-500/20 rounded-full mb-4">
          <History className="w-8 h-8 text-neon-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Version History
        </h3>
        <p className="text-dark-300">
          {versions.length} version{versions.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Version List */}
      <div className="space-y-3 mb-6">
        {versions.map((version) => (
          <div
            key={version.id}
            onClick={() => {
              setSelectedVersion(version)
              onVersionSelect?.(version)
            }}
            className={`
              p-3 rounded-lg border cursor-pointer transition-all duration-200
              ${selectedVersion?.id === version.id 
                ? 'border-neon-500/50 bg-neon-500/10' 
                : 'border-dark-600 hover:border-dark-500 bg-dark-800/30 hover:bg-dark-800/50'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`
                  px-2 py-1 rounded text-xs font-medium border
                  ${getVersionColor(version.version, maxVersion)}
                `}>
                  v{version.version}
                </div>
                <div className="flex items-center space-x-2 text-dark-400">
                  <Clock size={14} />
                  <span className="text-sm">{formatDate(version.createdAt)}</span>
                </div>
              </div>
              <div className="text-xs text-dark-400">
                {version.content.trim().split(/\s+/).filter(word => word.length > 0).length} words
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Version Details */}
      {selectedVersion && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">
              Version {selectedVersion.version} Details
            </h4>
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="text-sm text-neon-500 hover:text-neon-400 transition-colors"
            >
              {showDiff ? 'Hide' : 'Show'} Diff
            </button>
          </div>

          {/* Inline Diff Viewer */}
          {showDiff && selectedVersion && (
            <DiffViewer
              currentContent={selectedVersion.content}
              previousContent={versions.find(v => v.version === selectedVersion.version - 1)?.content || ''}
              showDiff={showDiff}
              onToggleDiff={() => setShowDiff(false)}
            />
          )}

          {/* Content Display */}
          {!showDiff && selectedVersion && (
            <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-600 max-h-96 overflow-y-auto">
              <MarkdownRenderer content={selectedVersion.content} />
            </div>
          )}

          <div className="space-y-4">
            {/* Prompt */}
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1">
                AI Prompt Used
              </label>
              <div className="text-sm text-white bg-dark-800/50 p-3 rounded border border-dark-600">
                {selectedVersion.prompt}
              </div>
            </div>

            {/* Version Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-dark-400">Created:</span>
                <p className="text-white mt-1">
                  {formatDate(selectedVersion.createdAt)}
                </p>
              </div>
              <div>
                <span className="text-dark-400">Word Count:</span>
                <p className="text-white mt-1">
                  {selectedVersion.content.trim().split(/\s+/).filter(word => word.length > 0).length}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          {versions.length > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  const currentIndex = versions.findIndex(v => v.id === selectedVersion.id)
                  if (currentIndex > 0) {
                    const prevVersion = versions[currentIndex - 1]
                    if (prevVersion) {
                      setSelectedVersion(prevVersion)
                      onVersionSelect?.(prevVersion)
                    }
                  }
                }}
                disabled={versions.findIndex(v => v.id === selectedVersion.id) === 0}
                className="flex items-center space-x-1 text-sm text-dark-400 hover:text-neon-500 disabled:text-dark-500 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              
              <span className="text-xs text-dark-400">
                {versions.findIndex(v => v.id === selectedVersion.id) + 1} of {versions.length}
              </span>
              
              <button
                onClick={() => {
                  const currentIndex = versions.findIndex(v => v.id === selectedVersion.id)
                  if (currentIndex < versions.length - 1) {
                    const nextVersion = versions[currentIndex + 1]
                    if (nextVersion) {
                      setSelectedVersion(nextVersion)
                      onVersionSelect?.(nextVersion)
                    }
                  }
                }}
                disabled={versions.findIndex(v => v.id === selectedVersion.id) === versions.length - 1}
                className="flex items-center space-x-1 text-sm text-neon-500 hover:text-neon-500 disabled:text-dark-500 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 
