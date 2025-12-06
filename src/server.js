import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import translationRoutes from './routes/translation.js';
import speechRoutes from './routes/speech.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { validateRequest, logRequest } from './middleware/security.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the backend root directory (one level up from src)
dotenv.config({ path: join(__dirname, '..', '.env') });

// Debug: Log if API key is loaded (without showing the actual key)
console.log('🔍 Environment check:');
console.log('  ASSEMBLYAI_API_KEY:', process.env.ASSEMBLYAI_API_KEY ? '✓ Set (' + process.env.ASSEMBLYAI_API_KEY.substring(0, 10) + '...)' : '✗ Not set');
console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Not set');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Allow CORS from localhost and local network IPs
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', /^http:\/\/192\.168\.\d+\.\d+:3000$/, /^http:\/\/10\.\d+\.\d+\.\d+:3000$/];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed patterns
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
      // For development, allow all origins (remove in production)
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(logRequest);
app.use(validateRequest);

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Healthcare Translation API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/translate', translationRoutes);
app.use('/api/speech', speechRoutes);

// Note: Enhancement endpoint is at /api/translate/enhance (defined in translation routes)

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  Warning: GEMINI_API_KEY not set. Translation features will not work.');
  }
  if (!process.env.ASSEMBLYAI_API_KEY) {
    console.warn('⚠️  Warning: ASSEMBLYAI_API_KEY not set. Speech-to-Text features will not work.');
    console.warn('   Get your free API key at: https://www.assemblyai.com/app/account');
  }
});
