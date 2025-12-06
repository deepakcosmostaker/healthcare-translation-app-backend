// Translation service using Google Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

class TranslationService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  // Lazy initialization - get model when needed
  getModel() {
    if (!this.model) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.');
      }
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Using gemini-2.0-flash-001 (stable, fast model for translation)
      // Alternative: 'models/gemini-2.5-flash' or 'models/gemini-2.5-pro' for better quality
      this.model = this.genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash-001' });
    }
    return this.model;
  }

  async translate(text, sourceLanguage, targetLanguage) {
    if (!text || !text.trim()) {
      return '';
    }

    try {
      const model = this.getModel();

      // Get language names for better context
      const languageNames = {
        en: 'English',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        it: 'Italian',
        pt: 'Portuguese',
        zh: 'Chinese',
        ja: 'Japanese',
        ko: 'Korean',
        ar: 'Arabic',
        hi: 'Hindi',
        ru: 'Russian',
      };

      const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
      const targetLangName = languageNames[targetLanguage] || targetLanguage;

      // Enhanced prompt for healthcare context
      const prompt = `You are a professional medical translator. Translate the following text from ${sourceLangName} to ${targetLangName}. 
      
Important guidelines:
- Preserve medical terminology accurately
- Maintain the original meaning and context
- Use appropriate medical terminology in the target language
- Keep the translation natural and clear
- If the text contains medical terms, ensure they are correctly translated
- Only provide the translation, no additional explanation

Text to translate: "${text}"

Translation:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();
      
      return translatedText;
    } catch (error) {
      // Log detailed error to console with limited stack trace
      console.error('Translation error:', error.message);
      if (error.cause) {
        console.error('Caused by:', error.cause.message);
      }
      if (error.stack) {
        const stackLines = error.stack.split('\n').slice(0, 4);
        stackLines.forEach(line => console.error(line));
      }
      // Throw simple error message
      throw new Error('Translation failed');
    }
  }

  async enhanceMedicalTerms(text) {
    try {
      const model = this.getModel();

      const prompt = `You are a medical transcription specialist. Review and correct any medical terminology in this transcript. 

Important:
- Correct spelling of medical terms
- Ensure proper medical terminology is used
- Maintain the original meaning
- Only provide the corrected text, no additional explanation

Transcript: "${text}"

Corrected version:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const enhancedText = response.text().trim();
      
      return enhancedText || text;
    } catch (error) {
      // Log detailed error to console with limited stack trace
      console.error('Medical term enhancement error:', error.message);
      if (error.cause) {
        console.error('Caused by:', error.cause.message);
      }
      if (error.stack) {
        const stackLines = error.stack.split('\n').slice(0, 4);
        stackLines.forEach(line => console.error(line));
      }
      return text; // Return original on error
    }
  }
}

export default new TranslationService();
