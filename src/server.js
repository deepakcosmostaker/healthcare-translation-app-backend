import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import translationRoutes from './routes/translation.js';
import speechRoutes from './routes/speech.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { validateRequest, logRequest } from './middleware/security.js';
import * as healthController from './controllers/healthController.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : process.env.NODE_ENV === 'production'
    ? [] // In production, require CORS_ORIGIN to be set
    : ['http://localhost:3000', /^http:\/\/192\.168\.\d+\.\d+:3000$/, /^http:\/\/10\.\d+\.\d+\.\d+:3000$/];

// Add Render frontend domains if in production
if (process.env.NODE_ENV === 'production') {
  // Allow Render frontend domains (common patterns)
  allowedOrigins.push(/^https:\/\/.*\.onrender\.com$/);
  allowedOrigins.push(/^https:\/\/.*\.vercel\.app$/);
  allowedOrigins.push(/^https:\/\/.*\.netlify\.app$/);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // In development, allow all origins for easier testing
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(logRequest);
app.use(validateRequest);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Healthcare Translation API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      translate: '/api/translate',
      enhance: '/api/translate/enhance',
      transcribe: '/api/speech/transcribe'
    }
  });
});

app.get('/health', healthController.healthCheck);
app.use('/api/translate', translationRoutes);
app.use('/api/speech', speechRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY not set. Translation features will not work.');
  }
  if (!process.env.ASSEMBLYAI_API_KEY) {
    console.warn('Warning: ASSEMBLYAI_API_KEY not set. Speech-to-Text features will not work.');
  }
});
