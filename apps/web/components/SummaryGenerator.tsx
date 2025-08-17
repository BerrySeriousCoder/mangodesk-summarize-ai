'use client'

import { useState } from 'react'
import { Sparkles, Loader2, FileText, Lightbulb } from 'lucide-react'
import { useAppStore, FileData } from '@/store/appStore'
import { MarkdownRenderer } from './MarkdownRenderer'
import API_ENDPOINTS from '@/config/api'

interface SummaryGeneratorProps {
  file: FileData
  onGenerated: () => void
  onBack: () => void
}

export function SummaryGenerator({ file, onGenerated, onBack }: SummaryGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedSummary, setGeneratedSummary] = useState<any | null>(null) // Changed type to any as SummaryData is removed
  const { setCurrentSummary, addSummary } = useAppStore()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a custom instruction')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Generate summary using file content that's already available
      const summaryResponse = await fetch(API_ENDPOINTS.GENERATE_SUMMARY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file.id,
          prompt: prompt,
          content: file.content,
        }),
      })

      if (!summaryResponse.ok) {
        const errorData = await summaryResponse.json()
        throw new Error(errorData.error || 'Failed to generate summary')
      }

      const result = await summaryResponse.json()
      
      const summaryData = { // Changed to any as SummaryData is removed
        id: result.summary.id,
        fileId: file.id,
        originalPrompt: result.summary.prompt,
        content: result.summary.content,
        createdAt: new Date(result.summary.createdAt),
        updatedAt: new Date(result.summary.updatedAt),
        version: result.summary.version,
        isActive: true
      }

      setGeneratedSummary(summaryData)
      setCurrentSummary(summaryData)
      addSummary(summaryData)

      setTimeout(() => {
        onGenerated()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const promptSuggestions = [
    'Summarize in bullet points for executives',
    'Highlight only action items and decisions',
    'Create a concise summary focusing on key outcomes',
    'Summarize with timeline of events',
    'Focus on risks and mitigation strategies',
    'Create a summary suitable for stakeholders'
  ]

  if (generatedSummary) {
    return (
      <div className="card animate-slide-up">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-neon-500/20 rounded-full mb-4">
            <Lightbulb className="w-8 h-8 text-neon-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Summary Generated Successfully!
          </h3>
          <p className="text-dark-300">
            Your AI summary is ready. Redirecting to editing...
          </p>
        </div>
        
        <div className="bg-dark-800/50 rounded-lg p-4 mb-4 border border-dark-600">
          <h4 className="font-medium text-white mb-2">Generated Summary:</h4>
          <div className="text-sm max-h-40 overflow-y-auto">
            <MarkdownRenderer content={generatedSummary.content} />
          </div>
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
          <FileText size={16} />
          <span>Back to Files</span>
        </button>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-neon-500/20 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-neon-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Generate AI Summary
        </h3>
        <p className="text-dark-300">
          Customize how you want your meeting transcript summarized
        </p>
      </div>

      <div className="bg-dark-800/50 rounded-lg p-4 mb-6 border border-dark-600">
        <div className="flex items-center space-x-3">
          <FileText className="text-dark-400" size={20} />
          <div>
            <p className="font-medium text-white">{file.originalName}</p>
            <p className="text-sm text-dark-300">
              {(file.size / 1024 / 1024).toFixed(2)} MB • Uploaded {file.uploadedAt.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="prompt" className="block text-sm font-medium text-white mb-2">
          Custom Instructions
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Summarize in bullet points for executives, highlight only action items..."
          className="input-field h-24 resize-none"
          disabled={isGenerating}
        />
        <p className="text-sm text-dark-400 mt-1">
          Describe how you want your summary formatted and what to focus on
        </p>
      </div>

      <div className="mb-6">
        <p className="text-sm font-medium text-white mb-3">Quick Suggestions:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {promptSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setPrompt(suggestion)}
              className="text-left p-2 text-sm text-dark-300 hover:text-neon-500 hover:bg-neon-500/10 rounded transition-colors"
              disabled={isGenerating}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className={`
            btn-primary inline-flex items-center space-x-2
            ${isGenerating || !prompt.trim() ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Summary</span>
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
    </div>
  )
} 