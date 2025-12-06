import express from 'express';
import * as speechController from '../controllers/speechController.js';

const router = express.Router();

/**
 * Speech Routes
 * All speech-to-text related endpoints
 */

// POST /api/speech/transcribe - Transcribe audio to text
router.post('/transcribe', speechController.transcribeAudio);

export default router;

