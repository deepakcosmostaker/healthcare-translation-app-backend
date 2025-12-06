import express from 'express';
import translationService from '../services/translationService.js';

const router = express.Router();

// Translation endpoint
router.post('/', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;
    
    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    if (!targetLanguage || !sourceLanguage) {
      return res.status(400).json({ error: 'Source and target languages are required' });
    }

    if (text.trim().length === 0) {
      return res.json({ 
        translatedText: '',
        originalText: text,
        sourceLanguage,
        targetLanguage
      });
    }

    // Translate text
    const translatedText = await translationService.translate(
      text,
      sourceLanguage,
      targetLanguage
    );

    // const translatedText = text;

    res.json({ 
      translatedText,
      originalText: text,
      sourceLanguage,
      targetLanguage
    });
  } catch (error) {
    // Log error with limited stack trace to console
    console.error('Translation route error:', error.message);
    if (error.cause) {
      console.error('Caused by:', error.cause.message);
    }
    // Print first few lines of stack trace only
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 4);
      stackLines.forEach(line => console.error(line));
    }
    
    // Return simple error message to client
    res.status(500).json({ 
      error: 'Translation failed'
    });
  }
});

// Medical term enhancement endpoint
router.post('/enhance', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const enhancedText = await translationService.enhanceMedicalTerms(text);
    // const enhancedText = text;

    res.json({ 
      originalText: text,
      enhancedText
    });
  } catch (error) {
    // Log error with limited stack trace to console
    console.error('Enhancement route error:', error.message);
    if (error.cause) {
      console.error('Caused by:', error.cause.message);
    }
    // Print first few lines of stack trace only
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 4);
      stackLines.forEach(line => console.error(line));
    }
    
    // Return simple error message to client
    res.status(500).json({ 
      error: 'Enhancement failed'
    });
  }
});

export default router;
