import translationService from '../services/translationService.js';
import { validateTranslationRequest, validateText } from '../utils/validators.js';

/**
 * Translation Controller
 * Handles translation-related business logic
 */

/**
 * Translate text from source language to target language
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const translateText = async (req, res, next) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;
    
    // Validate request using validator utility
    const validation = validateTranslationRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    // Handle empty text
    if (text.trim().length === 0) {
      return res.json({ 
        translatedText: '',
        originalText: text,
        sourceLanguage,
        targetLanguage
      });
    }

    // Translate text using service
    const translatedText = await translationService.translate(
      text,
      sourceLanguage,
      targetLanguage
    );

    // Return successful response
    res.json({ 
      translatedText,
      originalText: text,
      sourceLanguage,
      targetLanguage
    });
  } catch (error) {
    // Create error with appropriate status code
    const translationError = new Error('Translation failed');
    translationError.statusCode = 500;
    translationError.cause = error;
    // Pass error to error handling middleware
    next(translationError);
  }
};

/**
 * Enhance medical terms in transcript
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const enhanceMedicalTerms = async (req, res, next) => {
  try {
    const { text } = req.body;
    
    // Validate input using validator utility
    const validation = validateText(text);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    // Enhance medical terms using service
    const enhancedText = await translationService.enhanceMedicalTerms(text);

    // Return successful response
    res.json({ 
      originalText: text,
      enhancedText
    });
  } catch (error) {
    // Create error with appropriate status code
    const enhancementError = new Error('Enhancement failed');
    enhancementError.statusCode = 500;
    enhancementError.cause = error;
    // Pass error to error handling middleware
    next(enhancementError);
  }
};

