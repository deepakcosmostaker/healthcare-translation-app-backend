# Healthcare Translation Backend API

Backend API for real-time multilingual translation for healthcare providers and patients.

## Features

- **Translation API**: Translate text between multiple languages using Google Gemini AI
- **Medical Term Enhancement**: AI-powered correction and enhancement of medical terminology
- **Speech-to-Text**: Transcribe audio to text using AssemblyAI
- **Health Check**: Service status and configuration monitoring

## Tech Stack

- **Node.js** with Express.js
- **Google Gemini AI** for translation
- **AssemblyAI** for speech-to-text transcription
- **ES6 Modules** for modern JavaScript

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key
- AssemblyAI API key (optional, for speech-to-text)

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend root directory:
```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

4. Get API keys:
   - **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **AssemblyAI API Key**: Get from [AssemblyAI](https://www.assemblyai.com/app/account)

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port specified in `.env`).

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and service configuration.

**Response:**
```json
{
  "status": "ok",
  "message": "Healthcare Translation API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "gemini": true,
    "assemblyai": true,
    "allConfigured": true
  }
}
```

### Translate Text
```
POST /api/translate
```

**Request Body:**
```json
{
  "text": "Hello, how are you?",
  "sourceLanguage": "en",
  "targetLanguage": "es"
}
```

**Response:**
```json
{
  "translatedText": "Hola, ¿cómo estás?",
  "originalText": "Hello, how are you?",
  "sourceLanguage": "en",
  "targetLanguage": "es"
}
```

### Enhance Medical Terms
```
POST /api/translate/enhance
```

**Request Body:**
```json
{
  "text": "patiant has hyprtension"
}
```

**Response:**
```json
{
  "originalText": "patiant has hyprtension",
  "enhancedText": "patient has hypertension"
}
```

### Transcribe Audio
```
POST /api/speech/transcribe
```

**Request Body:**
```json
{
  "audioData": "base64_encoded_audio_data",
  "languageCode": "en"
}
```

**Response:**
```json
{
  "transcript": "Transcribed text here",
  "confidence": 0.95,
  "alternatives": []
}
```

## Supported Languages

- English (en)
- Hindi (hi)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Arabic (ar)
- Russian (ru)

## Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   │   ├── healthController.js
│   │   ├── speechController.js
│   │   └── translationController.js
│   ├── middleware/      # Express middleware
│   │   ├── errorHandler.js
│   │   └── security.js
│   ├── routes/          # API routes
│   │   ├── speech.js
│   │   └── translation.js
│   ├── services/        # Business logic
│   │   ├── speechService.js
│   │   └── translationService.js
│   ├── utils/           # Utility functions
│   │   └── validators.js
│   └── server.js        # Application entry point
├── .env                 # Environment variables (create this)
├── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3001) |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key | No (for speech-to-text) |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | No |
| `NODE_ENV` | Environment (development/production) | No |

## Error Handling

All errors follow this format:
```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `500` - Internal Server Error
- `503` - Service Unavailable

## Security

- Input validation and sanitization
- CORS configuration
- Request logging (development only)
- Error messages don't expose sensitive information

## Development

The project uses ES6 modules. Make sure your `package.json` has:
```json
{
  "type": "module"
}
```

## License

ISC

