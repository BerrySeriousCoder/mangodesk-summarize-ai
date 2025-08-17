export interface FileUpload {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
  content: string;
}

export interface Summary {
  id: string;
  fileId: string;
  originalPrompt: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  isActive: boolean;
}

export interface SummaryVersion {
  id: string;
  summaryId: string;
  content: string;
  prompt: string;
  createdAt: Date;
  version: number;
}

export interface EmailShare {
  id: string;
  summaryId: string;
  recipients: string[];
  subject: string;
  message: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed';
}

export interface AIGenerationRequest {
  content: string;
  prompt: string;
  maxTokens?: number;
}

export interface AIGenerationResponse {
  summary: string;
  tokensUsed: number;
  model: string;
}

export interface FileProcessingResult {
  success: boolean;
  content?: string;
  error?: string;
  fileType: string;
  wordCount: number;
}

export interface EmailRequest {
  recipientEmail: string;
  message?: string;
  summaryId: string;
  summaryContent: string;
  attachDocx: boolean;
  attachTxt: boolean;
  filename?: string; // Custom filename for attachments
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Global type declarations
declare global {
  var uploadedFiles: Map<string, FileUpload>;
  var summaries: Map<string, Summary>;
  var summaryVersions: Map<string, SummaryVersion[]>;
  var emailShares: Map<string, EmailShare>;
} 