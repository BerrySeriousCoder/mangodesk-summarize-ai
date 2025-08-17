import { create } from 'zustand'

export interface FileData {
  id: string
  originalName: string
  filename: string
  mimetype: string
  size: number
  uploadedAt: Date
  content: string
}

export interface SummaryData {
  id: string
  fileId: string
  originalPrompt: string
  content: string
  createdAt: Date
  updatedAt: Date
  version: number
  isActive: boolean
}

interface AppState {
  currentFile: FileData | null
  currentSummary: SummaryData | null
  uploadedFiles: FileData[]
  summaries: SummaryData[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setCurrentFile: (file: FileData | null) => void
  setCurrentSummary: (summary: SummaryData | null) => void
  addUploadedFile: (file: FileData) => void
  addSummary: (summary: SummaryData) => void
  updateSummary: (summaryId: string, updates: Partial<SummaryData>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentFile: null,
  currentSummary: null,
  uploadedFiles: [],
  summaries: [],
  isLoading: false,
  error: null,

  setCurrentFile: (file) => set({ currentFile: file }),
  
  setCurrentSummary: (summary) => set({ currentSummary: summary }),
  
  addUploadedFile: (file) => set((state) => ({
    uploadedFiles: [...state.uploadedFiles, file]
  })),
  
  addSummary: (summary) => set((state) => ({
    summaries: [...state.summaries, summary]
  })),
  
  updateSummary: (summaryId, updates) => set((state) => ({
    summaries: state.summaries.map(summary => 
      summary.id === summaryId 
        ? { ...summary, ...updates, updatedAt: new Date() }
        : summary
    ),
    currentSummary: state.currentSummary?.id === summaryId 
      ? { ...state.currentSummary, ...updates, updatedAt: new Date() }
      : state.currentSummary
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  reset: () => set({
    currentFile: null,
    currentSummary: null,
    uploadedFiles: [],
    summaries: [],
    isLoading: false,
    error: null
  })
})) 