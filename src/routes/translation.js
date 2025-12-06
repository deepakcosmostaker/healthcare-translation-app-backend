import express from 'express';
import * as translationController from '../controllers/translationController.js';

const router = express.Router();

/**
 * Translation Routes
 * All translation-related endpoints
 */

// POST /api/translate - Translate text from source to target language
router.post('/', translationController.translateText);

// POST /api/translate/enhance - Enhance medical terms in transcript
router.post('/enhance', translationController.enhanceMedicalTerms);

export default router;
