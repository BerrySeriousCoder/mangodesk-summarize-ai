'use client'

import { useState, useEffect, useCallback } from 'react'
import { GitCompare, EyeOff, Plus, Minus } from 'lucide-react'

interface DiffViewerProps {
  currentContent: string
  previousContent: string
  showDiff: boolean
  onToggleDiff: () => void
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  currentLineNumber?: number
  previousLineNumber?: number
  isContext?: boolean
}

export function DiffViewer({ currentContent, previousContent, showDiff, onToggleDiff }: DiffViewerProps) {
  const [diffLines, setDiffLines] = useState<DiffLine[]>([])

  const generateDiff = useCallback((current: string, previous: string) => {
    // Handle empty content cases
    if (!current && !previous) {
      setDiffLines([])
      return
    }
    
    if (!current) {
      const previousLines = previous.split('\n')
      const diff: DiffLine[] = previousLines.map((line, index) => ({
        type: 'removed',
        content: line,
        previousLineNumber: index + 1
      }))
      setDiffLines(diff)
      return
    }
    
    if (!previous) {
      const currentLines = current.split('\n')
      const diff: DiffLine[] = currentLines.map((line, index) => ({
        type: 'added',
        content: line,
        currentLineNumber: index + 1
      }))
      setDiffLines(diff)
      return
    }
    
    const currentLines = current.split('\n')
    const previousLines = previous.split('\n')
    
    const diff = computeSimpleDiff(previousLines, currentLines)
    setDiffLines(diff)
  }, [])

  useEffect(() => {
    if (showDiff) {
      generateDiff(currentContent, previousContent)
    }
  }, [currentContent, previousContent, showDiff, generateDiff])

  const computeSimpleDiff = (oldLines: string[], newLines: string[]): DiffLine[] => {
    const diff: DiffLine[] = []
    
    let oldIndex = 0
    let newIndex = 0
    
    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      if (oldIndex < oldLines.length && newIndex < newLines.length && 
          oldLines[oldIndex] === newLines[newIndex]) {
        diff.push({
          type: 'unchanged',
          content: oldLines[oldIndex] || '',
          currentLineNumber: newIndex + 1,
          previousLineNumber: oldIndex + 1
        })
        oldIndex++
        newIndex++
      } else {
        let foundMatch = false
        const lookAheadDistance = 3 // Look ahead up to 3 lines
        
        for (let i = 1; i <= lookAheadDistance && oldIndex + i < oldLines.length; i++) {
          if (newIndex < newLines.length && oldLines[oldIndex + i] === newLines[newIndex]) {
            for (let j = 0; j < i; j++) {
              diff.push({
                type: 'removed',
                content: oldLines[oldIndex + j] || '',
                previousLineNumber: oldIndex + j + 1
              })
            }
            oldIndex += i
            foundMatch = true
            break
          }
        }
        
        if (!foundMatch) {
          for (let i = 1; i <= lookAheadDistance && newIndex + i < newLines.length; i++) {
            if (oldIndex < oldLines.length && newLines[newIndex + i] === oldLines[oldIndex]) {
              for (let j = 0; j < i; j++) {
                diff.push({
                  type: 'added',
                  content: newLines[newIndex + j] || '',
                  currentLineNumber: newIndex + j + 1
                })
              }
              newIndex += i
              foundMatch = true
              break
            }
          }
        }
        
        if (!foundMatch) {
          if (oldIndex < oldLines.length) {
            diff.push({
              type: 'removed',
              content: oldLines[oldIndex] || '',
              previousLineNumber: oldIndex + 1
            })
            oldIndex++
          }
          if (newIndex < newLines.length) {
            diff.push({
              type: 'added',
              content: newLines[newIndex] || '',
              currentLineNumber: newIndex + 1
            })
            newIndex++
          }
        }
      }
    }
    
    return diff
  }

  if (!showDiff) {
    return null
  }

  return (
    <div className="bg-dark-800/50 rounded-lg border border-dark-600 overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-dark-700/50 border-b border-dark-600">
        <div className="flex items-center space-x-2">
          <GitCompare className="w-4 h-4 text-neon-500" />
          <span className="text-sm font-medium text-white">Version Comparison</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleDiff}
            className="flex items-center space-x-2 text-sm text-dark-400 hover:text-neon-500 transition-colors"
          >
            <EyeOff className="w-4 h-4" />
            <span>Hide Diff</span>
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto font-mono text-sm">
        {diffLines.map((line, index) => (
          <div
            key={index}
            className={`
              flex items-start group
              ${line.type === 'added' ? 'bg-green-500/10 border-l-4 border-green-500' : ''}
              ${line.type === 'removed' ? 'bg-red-500/10 border-l-4 border-red-500' : ''}
              ${line.type === 'unchanged' ? 'bg-dark-800/50 hover:bg-dark-700/50' : ''}
            `}
          >
            {/* Previous line number */}
            <div className="flex-shrink-0 w-12 text-right text-dark-400 mr-3 py-2 select-none">
              {line.previousLineNumber || '-'}
            </div>
            
            {/* Current line number */}
            <div className="flex-shrink-0 w-12 text-right text-dark-400 mr-3 py-2 select-none">
              {line.currentLineNumber || '-'}
            </div>
            
            {/* Change indicator */}
            <div className="flex-shrink-0 w-6 text-center py-2">
              {line.type === 'added' && (
                <Plus className="w-3 h-3 text-green-400 mx-auto" />
              )}
              {line.type === 'removed' && (
                <Minus className="w-3 h-3 text-red-400 mx-auto" />
              )}
              {line.type === 'unchanged' && (
                <span className="text-dark-500">·</span>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 py-2 pr-4">
              <span
                className={`
                  ${line.type === 'added' ? 'text-green-300' : ''}
                  ${line.type === 'removed' ? 'text-red-300' : ''}
                  ${line.type === 'unchanged' ? 'text-white' : ''}
                `}
              >
                {line.content || '\u00A0'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Diff Summary */}
      <div className="p-3 bg-dark-700/30 border-t border-dark-600 text-xs text-dark-300">
        <div className="flex items-center justify-between">
          <span>
            {diffLines.filter(l => l.type === 'added').length} additions,{' '}
            {diffLines.filter(l => l.type === 'removed').length} deletions
          </span>
          <span>
            {diffLines.filter(l => l.type === 'unchanged').length} unchanged lines
          </span>
        </div>
      </div>
    </div>
  )
} 