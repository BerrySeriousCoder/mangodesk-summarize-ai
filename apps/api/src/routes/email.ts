import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendSummaryEmail, validateEmailRequest } from '../services/emailService';
import { createError } from '../middleware/errorHandler';
import { EmailRequest } from '../types';
import { getDb } from '../db';
import { summaries, emailRequests } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.post('/send', async (req: Request, res: Response) => {
  try {
    const emailRequest: EmailRequest = req.body;

    const validation = validateEmailRequest(emailRequest);
    if (!validation.valid) {
      throw createError(`Validation failed: ${validation.errors.join(', ')}`, 400);
    }

    // Get summary from database
    const [summary] = await getDb().select().from(summaries).where(eq(summaries.id, emailRequest.summaryId));
    if (!summary) {
      throw createError('Summary not found', 404);
    }

    const emailRequestWithContent = {
      ...emailRequest,
      summaryContent: summary.content
    };

    const emailResponse = await sendSummaryEmail(emailRequestWithContent);

    if (!emailResponse.success) {
      throw createError(emailResponse.error || 'Failed to send email', 500);
    }

    // Create email request record in database
    const [emailRequestRecord] = await getDb().insert(emailRequests).values({
      id: uuidv4(),
      summaryId: emailRequest.summaryId,
      recipientEmail: emailRequest.recipientEmail,
      subject: `Meeting Summary: ${emailRequest.filename || 'Meeting Summary'}`,
      message: emailRequest.message || '',
      status: 'sent',
      sentAt: new Date()
    }).returning();

    if (!emailRequestRecord) {
      throw createError('Failed to save email request to database', 500);
    }

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      emailRequest: {
        id: emailRequestRecord.id,
        summaryId: emailRequestRecord.summaryId,
        recipientEmail: emailRequestRecord.recipientEmail,
        subject: emailRequestRecord.subject,
        sentAt: emailRequestRecord.sentAt,
        status: emailRequestRecord.status
      }
    });

  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    // Get email requests from database
    const shares = await getDb().select().from(emailRequests);

    res.json({
      success: true,
      shares: shares.map(share => ({
        id: share.id,
        summaryId: share.summaryId,
        recipientEmail: share.recipientEmail,
        subject: share.subject,
        sentAt: share.sentAt,
        status: share.status
      }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/:shareId', async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;

    if (!shareId) {
      throw createError('Share ID is required', 400);
    }

    // Get email request from database
    const [emailRequest] = await getDb().select().from(emailRequests).where(eq(emailRequests.id, shareId));
    if (!emailRequest) {
      throw createError('Email share not found', 404);
    }

    res.json({
      success: true,
      share: {
        id: emailRequest.id,
        summaryId: emailRequest.summaryId,
        recipientEmail: emailRequest.recipientEmail,
        subject: emailRequest.subject,
        message: emailRequest.message,
        sentAt: emailRequest.sentAt,
        status: emailRequest.status
      }
    });

  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

export { router as emailRouter }; 