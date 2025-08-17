'use client'

import { useState } from 'react'
import { FileText, FileDown, FileSpreadsheet } from 'lucide-react'
import { Document, Packer, Paragraph, TextRun } from 'docx'

interface ExportButtonProps {
  content: string
  fileName?: string
}

export function ExportButton({ content, fileName = 'meeting-summary' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'docx' | 'txt'>('docx')

  const exportAsDOCX = async () => {
    setIsExporting(true)
    try {
      const lines = content.split('\n')
      const docElements = []
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim() || ''
        if (!line) continue
        
        if (line.startsWith('## ')) {
          const titleText = line.replace(/^##\s+/, '')
          docElements.push(
            new Paragraph({
              spacing: { before: 800, after: 400 },
              children: [
                new TextRun({
                  text: titleText,
                  bold: true,
                  size: 52, 
                  color: '000000' 
                })
              ]
            })
          )
        } else if (line.startsWith('### ')) {
          const subtitleText = line.replace(/^###\s+/, '')
          docElements.push(
            new Paragraph({
              spacing: { before: 400, after: 200 },
              children: [
                new TextRun({
                  text: subtitleText,
                  bold: true,
                  size: 40, 
                  color: '000000' 
                })
              ]
            })
          )
        } else if (line.startsWith('# ')) {
          const titleText = line.replace(/^#\s+/, '')
          docElements.push(
            new Paragraph({
              spacing: { before: 800, after: 400 },
              children: [
                new TextRun({
                  text: titleText,
                  bold: true,
                  size: 56, 
                  color: '000000' 
                })
              ]
            })
          )
        } else if (line.startsWith('**') && line.endsWith('**')) {
          const boldText = line.replace(/^\*\*(.*?)\*\*$/, '$1')
          docElements.push(
            new Paragraph({
              spacing: { before: 300, after: 200 },
              children: [
                new TextRun({
                  text: boldText,
                  bold: true,
                  size: 32, 
                  color: '000000' 
                })
              ]
            })
          )
        } else if (line.includes('**')) {
          const paragraph = createFormattedParagraph(line)
          docElements.push(paragraph)
        } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
          const bulletText = line.replace(/^[-*+]\s+/, '')
          docElements.push(
            new Paragraph({
              spacing: { before: 120, after: 120 },
              indent: { left: 720 },
              children: [
                new TextRun({
                  text: '• ' + bulletText,
                  size: 24,
                  color: '000000' 
                })
              ]
            })
          )
        } else if (/^\d+\.\s+/.test(line)) {
          docElements.push(
            new Paragraph({
              spacing: { before: 120, after: 120 },
              indent: { left: 720 },
              children: [
                new TextRun({
                  text: line,
                  size: 24,
                  color: '000000' 
                })
              ]
            })
          )
        } else {
          const paragraph = createFormattedParagraph(line)
          docElements.push(paragraph)
        }
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: docElements
        }]
      })

      const blob = await Packer.toBlob(doc)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}.docx`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('DOCX export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const createFormattedParagraph = (text: string) => {
    const children: TextRun[] = []
    let currentIndex = 0
    
    const boldPattern = /\*\*(.*?)\*\*/g
    let match
    let hasBoldFormatting = false
    
    while ((match = boldPattern.exec(text)) !== null) {
      hasBoldFormatting = true
      
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index)
        if (beforeText) {
          children.push(
            new TextRun({
              text: beforeText,
              size: 24,
              color: '000000' 
            })
          )
        }
      }
      
      children.push(
        new TextRun({
          text: match[1],
          bold: true,
          size: 24,
          color: '000000' 
        })
      )
      
      currentIndex = match.index + match[0].length
    }
    
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex)
      if (remainingText) {
        children.push(
          new TextRun({
            text: remainingText,
            size: 24,
            color: '000000' 
          })
        )
      }
    }
    
    if (!hasBoldFormatting) {
      children.push(
        new TextRun({
          text: text,
          size: 24,
          color: '000000' 
        })
      )
    }
    
    return new Paragraph({
      spacing: { before: 120, after: 120 },
      children: children
    })
  }

  const exportAsTXT = () => {
    setIsExporting(true)
    try {
      // Preserve some formatting structure for TXT export
      let formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers but keep text
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markers but keep text
        .replace(/`(.*?)`/g, '$1') // Remove code markers but keep text
        .replace(/#{1,6}\s+(.*)/g, '$1') // Remove header markers but keep text
        .replace(/- \[(.*?)\]\((.*?)\)/g, '$1: $2') // Convert links to text
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Remove markdown links
        .replace(/^\s*[-*+]\s+/gm, '• ') // Convert list markers to bullets
        .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
        .trim();

      // Add some spacing for better readability in TXT
      formattedContent = formattedContent
        .replace(/\n\n+/g, '\n\n') // Normalize multiple empty lines
        .replace(/([.!?])\n/g, '$1\n\n') // Add extra line after sentences
        .replace(/\n•/g, '\n\n•'); // Add extra line before bullet points

      const blob = new Blob([formattedContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}.txt`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('TXT export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExport = async () => {
    switch (exportFormat) {
      case 'docx':
        await exportAsDOCX()
        break
      case 'txt':
        exportAsTXT()
        break
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <select
        value={exportFormat}
        onChange={(e) => setExportFormat(e.target.value as 'docx' | 'txt')}
        className="bg-dark-800/50 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-neon-500"
      >
        <option value="docx">DOCX</option>
        <option value="txt">TXT</option>
      </select>
      
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="btn-primary inline-flex items-center space-x-2"
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin"></div>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            {exportFormat === 'docx' && <FileSpreadsheet className="w-4 h-4" />}
            {exportFormat === 'txt' && <FileDown className="w-4 h-4" />}
            <span>Export</span>
          </>
        )}
      </button>
    </div>
  )
} 