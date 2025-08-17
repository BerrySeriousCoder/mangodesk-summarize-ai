// API Configuration for different environments
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // File upload endpoints
  UPLOAD: `${API_BASE_URL}/api/upload`,
  GET_FILE: (fileId: string) => `${API_BASE_URL}/api/upload/${fileId}`,
  
  // Summary endpoints
  GENERATE_SUMMARY: `${API_BASE_URL}/api/summary/generate`,
  UPDATE_SUMMARY: (summaryId: string) => `${API_BASE_URL}/api/summary/${summaryId}`,
  GET_SUMMARY: (summaryId: string) => `${API_BASE_URL}/api/summary/${summaryId}`,
  GET_SUMMARY_VERSIONS: (summaryId: string) => `${API_BASE_URL}/api/summary/${summaryId}/versions`,
  
  // Email endpoints
  SEND_EMAIL: `${API_BASE_URL}/api/email/send`,
  GET_EMAIL_HISTORY: `${API_BASE_URL}/api/email/history`,
  
  // Health endpoints
  HEALTH_DB: `${API_BASE_URL}/api/health/db`,
};

export default API_ENDPOINTS; 