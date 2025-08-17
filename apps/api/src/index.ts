import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import { fileUploadRouter } from './routes/fileUpload';
import { summaryRouter } from './routes/summary';
import { emailRouter } from './routes/email';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Additional security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000', // Local development
  process.env.FRONTEND_URL // Production frontend URL
].filter((origin): origin is string => Boolean(origin)); // Type guard to ensure only strings

console.log('🔒 CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    // This will trigger database connection if not already established
    const { getDb } = await import('./db/index.js');
    const { files } = await import('./db/schema.js');
    await getDb().select().from(files).limit(1);
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'Connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    });
  }
});

// API routes
app.use('/api/upload', fileUploadRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/email', emailRouter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app; 