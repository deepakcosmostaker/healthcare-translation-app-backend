/**
 * Validation utilities
 * Common validation functions for request data
 */

/**
 * Validate language code format
 * @param {string} langCode - Language code to validate
 * @returns {boolean} - True if valid
 */
export const isValidLanguageCode = (langCode) => {
  if (!langCode || typeof langCode !== 'string') {
    return false;
  }
  
  // Check if it's a 2-letter ISO code
  const twoLetterPattern = /^[a-z]{2}$/i;
  return twoLetterPattern.test(langCode);
};

/**
 * Validate text input
 * @param {string} text - Text to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {{valid: boolean, error?: string}} - Validation result
 */
export const validateText = (text, maxLength = 10000) => {
  if (!text) {
    return { valid: false, error: 'Text is required' };
  }
  
  if (typeof text !== 'string') {
    return { valid: false, error: 'Text must be a string' };
  }
  
  if (text.length > maxLength) {
    return { 
      valid: false, 
      error: `Text exceeds maximum length of ${maxLength} characters` 
    };
  }
  
  return { valid: true };
};

/**
 * Validate base64 audio data
 * @param {string} audioData - Base64 encoded audio data
 * @param {number} maxSize - Maximum size in bytes
 * @returns {{valid: boolean, error?: string}} - Validation result
 */
export const validateAudioData = (audioData, maxSize = 10 * 1024 * 1024) => {
  if (!audioData) {
    return { valid: false, error: 'Audio data is required' };
  }
  
  if (typeof audioData !== 'string') {
    return { valid: false, error: 'Audio data must be a base64 encoded string' };
  }
  
  // Check base64 format
  const base64Pattern = /^[A-Za-z0-9+/=]+$/;
  if (!base64Pattern.test(audioData)) {
    return { valid: false, error: 'Invalid base64 format' };
  }
  
  // Estimate size (base64 is ~33% larger than binary)
  const estimatedSize = (audioData.length * 3) / 4;
  if (estimatedSize > maxSize) {
    return { 
      valid: false, 
      error: `Audio data too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
    };
  }
  
  return { valid: true };
};

/**
 * Validate translation request body
 * @param {Object} body - Request body
 * @returns {{valid: boolean, error?: string}} - Validation result
 */
export const validateTranslationRequest = (body) => {
  const { text, sourceLanguage, targetLanguage } = body;
  
  // Validate text
  const textValidation = validateText(text);
  if (!textValidation.valid) {
    return textValidation;
  }
  
  // Validate source language
  if (!sourceLanguage) {
    return { valid: false, error: 'Source language is required' };
  }
  
  if (!isValidLanguageCode(sourceLanguage)) {
    return { valid: false, error: 'Invalid source language code' };
  }
  
  // Validate target language
  if (!targetLanguage) {
    return { valid: false, error: 'Target language is required' };
  }
  
  if (!isValidLanguageCode(targetLanguage)) {
    return { valid: false, error: 'Invalid target language code' };
  }
  
  // Check if source and target are different
  if (sourceLanguage.toLowerCase() === targetLanguage.toLowerCase()) {
    return { valid: false, error: 'Source and target languages must be different' };
  }
  
  return { valid: true };
};

