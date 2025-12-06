import { GoogleGenerativeAI } from '@google/generative-ai';

class TranslationService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  getModel() {
    if (!this.model) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.');
      }
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
        hi: 'Hindi',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        it: 'Italian',
        pt: 'Portuguese',
        zh: 'Chinese',
        ja: 'Japanese',
        ko: 'Korean',
        ar: 'Arabic',
        ru: 'Russian',
      };

      const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
      const targetLangName = languageNames[targetLanguage] || targetLanguage;

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
      console.error('Translation error:', error.message);
      if (error.cause) {
        console.error('Caused by:', error.cause.message);
      }
      throw new Error('Translation failed');
    }
  }

  async enhanceMedicalTerms(text) {
    try {
      const model = this.getModel();

      const prompt = `You are a medical transcription specialist. Your task is to review the following transcript and correct ONLY medical terminology, drug names, anatomical terms, and medical abbreviations.

CRITICAL RULES - FOLLOW STRICTLY:
1. ONLY correct medical terms, drug names, anatomical terms, and medical abbreviations
2. DO NOT change sentence structure, grammar, punctuation, or word order
3. DO NOT change non-medical words - leave them exactly as they are
4. DO NOT add or remove words
5. DO NOT rephrase or rewrite sentences
6. Keep the original meaning and flow exactly the same
7. If a word is not a medical term, leave it exactly as is
8. Only fix medical terms that are misspelled or incorrect
9. Return ONLY the corrected text without any explanations, notes, or additional text

Transcript: "${text}"

Corrected version (medical terms only, no other changes):`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const enhancedText = response.text().trim();
      
      return enhancedText || text;
    } catch (error) {
      console.error('Medical term enhancement error:', error.message);
      if (error.cause) {
        console.error('Caused by:', error.cause.message);
      }
      return text;
    }
  }
}

export default new TranslationService();
