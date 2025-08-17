'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/FileUpload'
import { SummaryGenerator } from '@/components/SummaryGenerator'
import { SummaryEditor } from '@/components/SummaryEditor'
import { EmailSharing } from '@/components/EmailSharing'
import { VersionHistory } from '@/components/VersionHistory'
import { useAppStore } from '@/store/appStore'

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'generate' | 'edit' | 'share'>('upload')
  const [versionKey, setVersionKey] = useState(0)
  const { currentFile, currentSummary } = useAppStore()

  const handleFileUploaded = () => {
    setCurrentStep('generate')
  }

  const handleSummaryGenerated = () => {
    setCurrentStep('edit')
  }

  const handleSummaryEdited = () => {
    setCurrentStep('share')
  }

  const resetToUpload = () => {
    setCurrentStep('upload')
  }

  return (
    <div className="space-y-8">
      {/* Progress Indicator - Always Horizontal */}
      <div className="flex justify-center mb-8">
        <div className="flex flex-row items-center space-x-2 lg:space-x-4 overflow-x-auto px-4 py-2">
          {['upload', 'generate', 'edit', 'share'].map((step, index) => (
            <div key={step} className="flex items-center flex-shrink-0">
              <div className="flex items-center space-x-2 lg:space-x-3">
                <div className={`
                  progress-step
                  ${currentStep === step 
                    ? 'active' 
                    : index < ['upload', 'generate', 'edit', 'share'].indexOf(currentStep)
                    ? 'completed'
                    : 'pending'
                  }
                `}>
                  {index + 1}
                </div>
                <span className={`
                  text-xs lg:text-sm font-medium transition-colors duration-300 text-center
                  ${currentStep === step ? 'text-neon-400' : 'text-dark-400'}
                `}>
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </span>
              </div>
              {index < 3 && (
                <div className={`
                  w-8 h-0.5 lg:w-16 transition-all duration-300 ml-2 lg:ml-4
                  ${index < ['upload', 'generate', 'edit', 'share'].indexOf(currentStep) 
                    ? 'bg-neon-500' 
                    : 'bg-dark-600'
                  }
                `} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[600px]">
        {currentStep === 'upload' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-white mb-8">
              Upload Your Meeting Transcript
            </h2>
            <FileUpload onUploaded={handleFileUploaded} />
          </div>
        )}

        {currentStep === 'generate' && currentFile && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-white mb-8">
              Generate AI Summary
            </h2>
            <SummaryGenerator 
              file={currentFile} 
              onGenerated={handleSummaryGenerated}
              onBack={resetToUpload}
            />
          </div>
        )}

        {currentStep === 'edit' && currentSummary && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-white mb-8">
              Edit & Review Summary
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <SummaryEditor 
                  summary={currentSummary} 
                  onEdited={handleSummaryEdited}
                  onBack={() => setCurrentStep('generate')}
                  onVersionCreated={() => {
                    // Force re-render of VersionHistory by updating the key
                    setVersionKey(prev => prev + 1)
                  }}
                />
              </div>
              <div>
                <VersionHistory 
                  key={`${currentSummary.id}-${currentSummary.version}-${versionKey}`}
                  summaryId={currentSummary.id} 
                  onVersionSelect={(version) => {
                    // Update the current summary in the store
                    useAppStore.getState().setCurrentSummary({
                      ...currentSummary,
                      content: version.content,
                      version: version.version
                    })
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 'share' && currentSummary && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-white mb-8">
              Share Your Summary
            </h2>
            <EmailSharing 
              summary={currentSummary}
              onBack={() => setCurrentStep('edit')}
              onComplete={resetToUpload}
            />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {currentStep !== 'upload' && (
        <div className="text-center">
          <button
            onClick={resetToUpload}
            className="btn-secondary"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  )
}
