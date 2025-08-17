'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle } from 'lucide-react'
import { useAppStore, FileData } from '@/store/appStore'
import API_ENDPOINTS from '@/config/api'

interface FileUploadProps {
  onUploaded: () => void
}

export function FileUpload({ onUploaded }: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<FileData | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setCurrentFile, addUploadedFile } = useAppStore()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setError(null)
    setIsUploading(true)

    try {
      // Validate file size (10MB limit)
      if (file && file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }

      // Validate file type
      const allowedTypes = [
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ]
      
      if (file && !allowedTypes.includes(file.type)) {
        throw new Error('Only .txt and .docx files are allowed')
      }



      const formData = new FormData()
      if (file) {
        formData.append('file', file)
      }

      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      // Get file content from backend
      const fileContentResponse = await fetch(API_ENDPOINTS.GET_FILE(result.fileId))
      if (!fileContentResponse.ok) {
        throw new Error('Failed to fetch file content')
      }
      
      const fileContentData = await fileContentResponse.json()
      
      const fileData: FileData = {
        id: result.fileId,
        originalName: file?.name || '',
        filename: file?.name || '',
        mimetype: file?.type || '',
        size: file?.size || 0,
        uploadedAt: new Date(),
        content: fileContentData.file.content
      }

      setUploadedFile(fileData)
      setCurrentFile(fileData)
      addUploadedFile(fileData)

      setTimeout(() => {
        onUploaded()
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [setCurrentFile, addUploadedFile, onUploaded])

  const { getRootProps, getInputProps, isDragActive, isDragReject, isDragAccept } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: 1,
    disabled: isUploading
  })

  const getDropzoneClasses = () => {
    let baseClasses = "dropzone"
    if (isDragActive) {
      if (isDragReject) {
        baseClasses += " dropzone-reject"
      } else if (isDragAccept) {
        baseClasses += " dropzone-accept"
      } else {
        baseClasses += " dropzone-active"
      }
    }
    return baseClasses
  }

  const removeFile = () => {
    setUploadedFile(null)
    setCurrentFile(null)
    setError(null)
  }

  if (uploadedFile) {
    return (
      <div className="card animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">File Uploaded Successfully!</h3>
          <button
            onClick={removeFile}
            className="text-dark-400 hover:text-neon-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex items-center space-x-3 p-4 bg-neon-500/10 rounded-lg border border-neon-500/30">
          <CheckCircle className="text-neon-500" size={24} />
          <div>
            <p className="font-medium text-neon-400">{uploadedFile.originalName}</p>
            <p className="text-sm text-neon-300">
              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 text-neon-400">
            <CheckCircle size={16} />
            <span>Processing... Redirecting to next step</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Upload Meeting Transcript</h2>
        <p className="text-dark-300">Drag and drop your file here or click to browse</p>
      </div>
      
      <div 
        {...getRootProps()} 
        className={`${getDropzoneClasses()} dropzone-mobile`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className={`p-4 rounded-full transition-all duration-300 ${
              isDragActive 
                ? 'bg-neon-500/20 text-neon-500' 
                : 'bg-dark-700/50 text-dark-300'
            }`}>
              <Upload size={48} className="mx-auto" />
            </div>
          </div>
          
          <div className="space-y-2">
            <p className={`text-lg font-medium transition-colors duration-300 ${
              isDragActive ? 'text-neon-500' : 'text-white'
            }`}>
              {isDragActive 
                ? (isDragReject ? 'File type not supported' : 'Drop your file here')
                : 'Choose a file or drag it here'
              }
            </p>
            <p className="text-sm text-dark-400">
              Supports: .txt, .docx, .doc (Max: 10MB)
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <X className="text-red-400" size={16} />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-dark-400">
        <p>Supported formats: .txt, .docx</p>
        <p>Maximum file size: 10MB</p>
      </div>
    </div>
  )
} 