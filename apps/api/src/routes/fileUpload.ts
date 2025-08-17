import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { processFile } from '../services/fileProcessor';
import { createError } from '../middleware/errorHandler';
import { getDb } from '../db';
import { files } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only text and document files
    if (file.mimetype === 'text/plain' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt and .docx files are allowed'));
    }
  }
});

// File upload endpoint
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const { file } = req;
    
    // Process the file content
    const processingResult = await processFile(file);
    
    if (!processingResult.success) {
      throw createError(processingResult.error || 'Failed to process file', 400);
    }

    // Create file upload record in database
    const fileId = uuidv4();
    const [fileRecord] = await getDb().insert(files).values({
      id: fileId,
      originalName: file.originalname,
      fileName: file.filename || file.originalname,
      filePath: `uploads/${fileId}`, // Virtual path for reference
      fileSize: file.size,
      mimeType: file.mimetype,
      wordCount: processingResult.wordCount || 0,
      content: processingResult.content!
    }).returning();

    if (!fileRecord) {
      throw createError('Failed to save file to database', 500);
    }

    res.status(201).json({
      success: true,
      fileId: fileRecord.id,
      message: 'File uploaded successfully',
      fileInfo: {
        id: fileRecord.id,
        originalName: fileRecord.originalName,
        size: fileRecord.fileSize,
        wordCount: fileRecord.wordCount,
        fileType: fileRecord.mimeType
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

// Get uploaded file content
router.get('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      throw createError('File ID is required', 400);
    }

    const [file] = await getDb().select().from(files).where(eq(files.id, fileId));
    
    if (!file) {
      throw createError('File not found', 404);
    }
    
    res.json({
      success: true,
      file: {
        id: file.id,
        originalName: file.originalName,
        content: file.content,
        createdAt: file.createdAt
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

export { router as fileUploadRouter }; 