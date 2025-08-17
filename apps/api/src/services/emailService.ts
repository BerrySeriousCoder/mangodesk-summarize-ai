import { Resend } from 'resend';
import { EmailRequest, EmailResponse } from '../types';
import { Document, Packer, Paragraph, TextRun, ISectionOptions } from 'docx';

// Lazy initialization - only create Resend instance when needed
let resendInstance: Resend | null = null;

function getResendInstance(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Resend API key not configured');
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

// Helper function to create DOCX attachment
async function createDocxAttachment(content: string, fileName: string): Promise<Buffer> {
  // Parse content to identify headers and structure
  const lines = content.split('\n')
  const docElements: Paragraph[] = [] // Explicitly type as Paragraph[]
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() || ''
    if (!line) continue
    
    // Handle different markdown patterns
    if (line.startsWith('### ')) {
      const subtitleText = line.replace(/^###\s+/, '')
      docElements.push(
        new Paragraph({
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({
              text: subtitleText,
              bold: true,
              size: 32, 
              color: '000000' 
            })
          ]
        })
      )
    } else if (line.startsWith('## ')) {
      const subtitleText = line.replace(/^##\s+/, '')
      docElements.push(
        new Paragraph({
          spacing: { before: 600, after: 300 },
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

  return await Packer.toBuffer(doc)
}

// Helper function to create formatted paragraph with bold text
function createFormattedParagraph(text: string): Paragraph {
  const children: TextRun[] = []
  let currentIndex = 0
  
  const boldPattern = /\*\*(.*?)\*\*/g
  let match
  
  while ((match = boldPattern.exec(text)) !== null) {
    // Add text before the bold part
    if (match.index > currentIndex) {
      children.push(
        new TextRun({
          text: text.slice(currentIndex, match.index),
          size: 24,
          color: '000000'
        })
      )
    }
    
    // Add the bold text
    children.push(
      new TextRun({
        text: match[1] || '',
        bold: true,
        size: 24,
        color: '000000'
      })
    )
    
    currentIndex = match.index + match[0].length
  }
  
  // Add remaining text after the last bold part
  if (currentIndex < text.length) {
    children.push(
      new TextRun({
        text: text.slice(currentIndex),
        size: 24,
        color: '000000'
      })
    )
  }
  
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    children: children.length > 0 ? children : [
      new TextRun({
        text: text,
        size: 24,
        color: '000000'
      })
    ]
  })
}

// Helper function to create TXT attachment
function createTxtAttachment(content: string): Buffer {
  const cleanContent = content
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s+(.*)/g, '$1')
    .replace(/- \[(.*?)\]\((.*?)\)/g, '$1: $2')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '')
    .trim();

  return Buffer.from(cleanContent, 'utf-8')
}

export async function sendSummaryEmail(request: EmailRequest): Promise<EmailResponse> {
  try {
    const resend = getResendInstance();

    // Get summary content from the request
    const summaryContent = request.summaryContent || "Summary content not available";

    // Generate smart default filename if none provided
    const getDefaultFilename = (content: string): string => {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        // Try to extract title from first line
        const firstLine = lines[0]?.trim() || '';
        if (firstLine.startsWith('# ')) {
          return firstLine.replace(/^#\s+/, '').replace(/[^\w\s-]/g, '').trim();
        }
        // If first line looks like a title (short, starts with capital)
        if (firstLine.length < 50 && /^[A-Z]/.test(firstLine)) {
          return firstLine.replace(/[^\w\s-]/g, '').trim();
        }
      }
      return 'Meeting Summary';
    };

    const baseFilename = request.filename?.trim() || getDefaultFilename(summaryContent);
    const safeFilename = baseFilename.replace(/[^\w\s-]/g, '').trim() || 'Meeting Summary';

    // Prepare attachments
    const attachments: any[] = [];
    
    if (request.attachDocx) {
      const docxBuffer = await createDocxAttachment(summaryContent, `${safeFilename}.docx`);
      attachments.push({
        filename: `${safeFilename}.docx`,
        content: docxBuffer.toString('base64')
      });
    }
    
    if (request.attachTxt) {
      const txtBuffer = createTxtAttachment(summaryContent);
      attachments.push({
        filename: `${safeFilename}.txt`,
        content: txtBuffer.toString('base64')
      });
    }

    // Create email HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Meeting Summary</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Meeting Summary</h1>
              <p>Generated by MangoDesk</p>
            </div>
            
            <div class="content">
              ${request.message ? `<p><strong>Personal Message:</strong> ${request.message}</p>` : ''}
              
              <p><strong>Summary Attached</strong></p>
              <p>The complete meeting summary is attached to this email for your convenience.</p>
              
              ${attachments.length > 0 ? `
                <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>📎 Attachments:</h3>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    ${attachments.map(att => `<li>${att.filename}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p>This summary was generated using AI technology.</p>
              <p>Sent on ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    const emailPromises = [request.recipientEmail].map(async (recipient) => {
      return resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
        to: recipient,
        subject: `Meeting Summary: ${safeFilename}`,
        html: htmlContent,
        attachments: attachments.length > 0 ? attachments : undefined
      });
    });

    const results = await Promise.all(emailPromises);
    
    const allSuccessful = results.every(result => result.data?.id);
    
    if (allSuccessful) {
      return {
        success: true,
        messageId: results[0]?.data?.id || 'unknown'
      };
    } else {
      return {
        success: false,
        error: 'Some emails failed to send'
      };
    }

  } catch (error) {
    console.error('Email sending error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Email service not properly configured');
      } else if (error.message.includes('quota')) {
        throw new Error('Email service quota exceeded');
      } else if (error.message.includes('invalid')) {
        throw new Error('Invalid email address provided');
      }
    }
    
    throw new Error('Failed to send email. Please try again.');
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEmailRequest(request: EmailRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.summaryId) {
    errors.push('Summary ID is required');
  }

  if (!request.recipientEmail) {
    errors.push('Recipient email is required');
  } else if (!validateEmail(request.recipientEmail)) {
    errors.push(`Invalid recipient email: ${request.recipientEmail}`);
  }

  if (request.message && request.message.length > 500) {
    errors.push('Message is too long (max 500 characters)');
  }

  if (!request.attachDocx && !request.attachTxt) {
    errors.push('At least one attachment type must be selected');
  }

  return {
    valid: errors.length === 0,
    errors
  };
} 