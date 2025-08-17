import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIGenerationRequest, AIGenerationResponse } from '../types';

// Lazy initialization - only create Gemini AI instance when needed
let genAIInstance: GoogleGenerativeAI | null = null;

function getGenAIInstance(): GoogleGenerativeAI {
  if (!genAIInstance) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }
    genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAIInstance;
}

export async function generateSummary(request: AIGenerationRequest): Promise<AIGenerationResponse> {
  try {
    const genAI = getGenAIInstance();
    
    const modelNames = ['gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let model;
    let lastError;
    
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent('test');
        break; 
      } catch (error) {
        lastError = error;
        console.log(`Model ${modelName} not available, trying next...`);
        continue;
      }
    }
    
    if (!model) {
      const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
      throw new Error(`No available Gemini models found. Please check your API key and model availability. Last error: ${errorMessage}`);
    }

    // Construct the prompt
    const prompt = `
You are an expert meeting notes summarizer. Your task is to create a clear, structured summary based on the following content and user instructions.

CONTENT TO SUMMARIZE:
${request.content}

USER INSTRUCTIONS:
${request.prompt}

Please provide a well-structured summary that follows the user's instructions. Make sure the summary is:
- Clear and concise
- Well-organized with appropriate headings/sections
- Professional in tone
- Actionable when applicable

SUMMARY:
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    const tokensUsed = 0; 

    return {
      summary: summary.trim(),
      tokensUsed,
      model: model.model || 'gemini-2.0-flash-exp'
    };

  } catch (error) {
    console.error('AI generation error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('AI service not properly configured');
      } else if (error.message.includes('quota')) {
        throw new Error('AI service quota exceeded');
      } else if (error.message.includes('content')) {
        throw new Error('Content violates AI service policies');
      }
    }
    
    throw new Error('Failed to generate summary. Please try again.');
  }
}

export async function validatePrompt(prompt: string): Promise<boolean> {
  if (!prompt || prompt.trim().length === 0) {
    return false;
  }
  
  if (prompt.length > 500) {
    return false;
  }
  
  const harmfulKeywords = ['hack', 'exploit', 'bypass', 'unauthorized'];
  const lowerPrompt = prompt.toLowerCase();
  
  for (const keyword of harmfulKeywords) {
    if (lowerPrompt.includes(keyword)) {
      return false;
    }
  }
  
  return true;
} 