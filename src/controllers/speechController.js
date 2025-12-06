import speechService from '../services/speechService.js';
import { validateAudioData, isValidLanguageCode } from '../utils/validators.js';

/**
 * Speech Controller
 * Handles speech-to-text related business logic
 */

/**
 * Transcribe audio data to text
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const transcribeAudio = async (req, res, next) => {
  try {
    const { audioData, languageCode } = req.body;
    
    // Validate audio data using validator utility
    const audioValidation = validateAudioData(audioData);
    if (!audioValidation.valid) {
      return res.status(400).json({ 
        error: audioValidation.error 
      });
    }

    // Convert base64 audio data to buffer
    let audioBuffer;
    try {
      audioBuffer = Buffer.from(audioData, 'base64');
      
      // Additional buffer validation
      if (audioBuffer.length === 0) {
        return res.status(400).json({ 
          error: 'Invalid audio data: empty buffer' 
        });
      }
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid audio data format. Expected base64 encoded string.' 
      });
    }

    // Default language code (AssemblyAI uses 2-letter codes like 'en', 'es')
    const langCode = languageCode || 'en';

    // Validate language code format using validator utility
    if (!isValidLanguageCode(langCode)) {
      return res.status(400).json({ 
        error: 'Invalid language code. Expected 2-letter ISO code (e.g., "en", "es")' 
      });
    }

    // Transcribe audio using service
    const result = await speechService.transcribe(audioBuffer, langCode);

    // Return successful response
    res.json({
      transcript: result.transcript || '',
      confidence: result.confidence || null,
      alternatives: result.alternatives || []
    });
  } catch (error) {
    // Create error with appropriate status code
    const transcriptionError = new Error('Transcription failed');
    transcriptionError.statusCode = 500;
    transcriptionError.cause = error;
    // Pass error to error handling middleware
    next(transcriptionError);
  }
};

