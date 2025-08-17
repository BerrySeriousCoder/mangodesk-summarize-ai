import mammoth from 'mammoth';
import { FileProcessingResult } from '../types';

export async function processFile(file: Express.Multer.File): Promise<FileProcessingResult> {
  try {
    let content = '';
    let fileType = '';

    if (file.mimetype === 'text/plain') {
      // Handle .txt files
      content = file.buffer.toString('utf-8');
      fileType = 'text';
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Handle .docx files
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      content = result.value;
      fileType = 'docx';
      
      if (result.messages.length > 0) {
        console.warn('Warning messages from mammoth:', result.messages);
      }
    } else if (file.mimetype === 'application/msword') {
      // Handle .doc files (basic support)
      content = file.buffer.toString('utf-8');
      fileType = 'doc';
    } else {
      return {
        success: false,
        error: 'Unsupported file type',
        fileType: 'unknown',
        wordCount: 0
      };
    }

    content = content.trim();
    
    if (!content) {
      return {
        success: false,
        error: 'File appears to be empty',
        fileType,
        wordCount: 0
      };
    }

    
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    if (wordCount > 10000) {
      return {
        success: false,
        error: 'File is too long. Maximum 10,000 words allowed.',
        fileType,
        wordCount
      };
    }

    return {
      success: true,
      content,
      fileType,
      wordCount
    };

  } catch (error) {
    console.error('Error processing file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      fileType: 'unknown',
      wordCount: 0
    };
  }
} 