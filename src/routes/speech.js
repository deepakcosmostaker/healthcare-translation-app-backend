import express from 'express';
import speechService from '../services/speechService.js';

const router = express.Router();

// Speech-to-text endpoint using AssemblyAI
router.post('/transcribe', async (req, res) => {
  try {
    const { audioData, languageCode } = req.body;
    
    // Validation
    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Convert base64 audio data to buffer
    let audioBuffer;
    try {
      audioBuffer = Buffer.from(audioData, 'base64');
    } catch (error) {
      return res.status(400).json({ error: 'Invalid audio data format' });
    }

    // Default language code (AssemblyAI uses 2-letter codes like 'en', 'es')
    const langCode = languageCode || 'en';

    // Transcribe audio
    const result = await speechService.transcribe(audioBuffer, langCode);

    res.json({
      transcript: result.transcript,
      confidence: result.confidence,
      alternatives: result.alternatives || []
    });
  } catch (error) {
    // Log error with limited stack trace to console
    console.error('Transcription route error:', error.message);
    if (error.cause) {
      console.error('Caused by:', error.cause.message);
    }
    // Print first few lines of stack trace only
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 4);
      stackLines.forEach(line => console.error(line));
    }
    
    // Return simple error message to client
    res.status(500).json({ error: 'Transcription failed' });
  }
});

export default router;

