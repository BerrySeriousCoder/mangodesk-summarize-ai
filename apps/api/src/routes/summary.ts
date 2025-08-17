import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateSummary, validatePrompt } from '../services/aiService';
import { createError } from '../middleware/errorHandler';
import { AIGenerationRequest } from '../types';
import { getDb } from '../db';
import { summaries, summaryVersions, files } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { fileId, prompt, content }: { fileId: string; prompt: string; content: string } = req.body;

    if (!fileId || !prompt || !content) {
      throw createError('Missing required fields: fileId, prompt, content', 400);
    }

    // Check if file exists in database
    const [file] = await getDb().select().from(files).where(eq(files.id, fileId));
    if (!file) {
      throw createError('File not found', 404);
    }

    if (!(await validatePrompt(prompt))) {
      throw createError('Invalid prompt provided', 400);
    }

    const aiRequest: AIGenerationRequest = {
      content,
      prompt,
      maxTokens: 1000
    };

    const aiResponse = await generateSummary(aiRequest);

    const summaryId = uuidv4();
    
    // Create summary in database
    const [summary] = await getDb().insert(summaries).values({
      id: summaryId,
      fileId,
      originalPrompt: prompt,
      content: aiResponse.summary,
      version: 1,
      isActive: true,
      tokensUsed: aiResponse.tokensUsed,
      model: aiResponse.model
    }).returning();

    if (!summary) {
      throw createError('Failed to save summary to database', 500);
    }

    // Create version history record
    await getDb().insert(summaryVersions).values({
      id: uuidv4(),
      summaryId: summary.id,
      content: aiResponse.summary,
      prompt,
      version: 1
    });

    res.status(201).json({
      success: true,
      summary: {
        id: summary.id,
        content: summary.content,
        prompt: summary.originalPrompt,
        createdAt: summary.createdAt,
        version: summary.version,
        tokensUsed: aiResponse.tokensUsed,
        model: aiResponse.model
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

// Update summary content
router.put('/:summaryId', async (req: Request, res: Response) => {
  try {
    const { summaryId } = req.params;
    const { content, prompt }: { content: string; prompt?: string } = req.body;

    if (!summaryId || !content) {
      throw createError('Summary ID and content are required', 400);
    }

    // Check if summary exists
    const [existingSummary] = await getDb().select().from(summaries).where(eq(summaries.id, summaryId));
    if (!existingSummary) {
      throw createError('Summary not found', 404);
    }

    const newVersion = existingSummary.version + 1;

    // Create new version record
    await getDb().insert(summaryVersions).values({
      id: uuidv4(),
      summaryId: summaryId,
      content,
      prompt: prompt || existingSummary.originalPrompt,
      version: newVersion
    });

    // Update summary
    const [updatedSummary] = await getDb().update(summaries)
      .set({
        content,
        version: newVersion,
        updatedAt: new Date()
      })
      .where(eq(summaries.id, summaryId))
      .returning();

    if (!updatedSummary) {
      throw createError('Failed to update summary', 500);
    }

    res.json({
      success: true,
      summary: {
        id: updatedSummary.id,
        content: updatedSummary.content,
        version: updatedSummary.version,
        updatedAt: updatedSummary.updatedAt
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

// Get summary by ID
router.get('/:summaryId', async (req: Request, res: Response) => {
  try {
    const { summaryId } = req.params;

    if (!summaryId) {
      throw createError('Summary ID is required', 400);
    }

    // Get summary from database
    const [summary] = await getDb().select().from(summaries).where(eq(summaries.id, summaryId));
    if (!summary) {
      throw createError('Summary not found', 404);
    }

    // Get versions from database
    const versions = await getDb().select().from(summaryVersions).where(eq(summaryVersions.summaryId, summaryId));

    res.json({
      success: true,
      summary: {
        id: summary.id,
        fileId: summary.fileId,
        content: summary.content,
        prompt: summary.originalPrompt,
        createdAt: summary.createdAt,
        updatedAt: summary.updatedAt,
        version: summary.version,
        versions: versions.map(v => ({
          id: v.id,
          content: v.content,
          prompt: v.prompt,
          createdAt: v.createdAt,
          version: v.version
        }))
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

// Get version history
router.get('/:summaryId/versions', async (req: Request, res: Response) => {
  try {
    const { summaryId } = req.params;

    if (!summaryId) {
      throw createError('Summary ID is required', 400);
    }

    // Check if summary exists
    const [summary] = await getDb().select().from(summaries).where(eq(summaries.id, summaryId));
    if (!summary) {
      throw createError('Summary not found', 404);
    }

    // Get versions from database
    const versions = await getDb().select().from(summaryVersions).where(eq(summaryVersions.summaryId, summaryId));

    res.json({
      success: true,
      versions: versions.map(v => ({
        id: v.id,
        content: v.content,
        prompt: v.prompt,
        createdAt: v.createdAt,
        version: v.version
      }))
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

export { router as summaryRouter }; 