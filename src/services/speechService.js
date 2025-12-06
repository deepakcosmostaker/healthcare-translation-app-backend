// AssemblyAI Speech-to-Text service
import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import path from 'path';
import os from 'os';

class SpeechService {
  constructor() {
    // Don't initialize client here - do it lazily when needed
    // This ensures dotenv.config() has been called first
    this.client = null;
    this._initialized = false;
  }

  /**
   * Initialize the AssemblyAI client (lazy initialization)
   */
  initializeClient() {
    if (this._initialized) {
      return this.client;
    }

    this._initialized = true;
    
    // Initialize AssemblyAI client
    // Uses ASSEMBLYAI_API_KEY environment variable
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
      console.warn('⚠️  Warning: ASSEMBLYAI_API_KEY not set. Speech-to-Text features will not work.');
      console.warn('   Get your free API key at: https://www.assemblyai.com/app/account');
      this.client = null;
      return null;
    }

    try {
      this.client = new AssemblyAI({ apiKey: apiKey.trim() });
      console.log('✓ AssemblyAI Speech-to-Text client initialized');
      return this.client;
    } catch (error) {
      console.error('Error initializing AssemblyAI client:', error.message);
      if (error.stack) {
        const stackLines = error.stack.split('\n').slice(0, 3);
        stackLines.forEach(line => console.error(line));
      }
      this.client = null;
      return null;
    }
  }

  /**
   * Transcribe audio using AssemblyAI
   * @param {Buffer} audioBuffer - Audio data as buffer
   * @param {string} languageCode - Language code (e.g., 'en', 'es', 'fr')
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Transcription result
   */
  async transcribe(audioBuffer, languageCode = 'en', options = {}) {
    // Lazy initialization - ensure client is initialized
    const client = this.initializeClient();
    if (!client) {
      throw new Error('AssemblyAI client not initialized. Please set ASSEMBLYAI_API_KEY in your .env file.');
    }

    try {
      // AssemblyAI accepts audio file or URL
      // For base64 audio, we need to create a temporary file or use the buffer directly
      // AssemblyAI SDK can handle buffers directly
      
      const config = {
        language_code: this.mapLanguageCode(languageCode),
        punctuate: true,
        format_text: true,
        // Medical/healthcare specific settings
        word_boost: options.wordBoost || [],
        // Enable speaker diarization if needed
        speaker_labels: options.speakerLabels || false,
      };

      // AssemblyAI can accept a file path, URL, or buffer
      // First, let's check if the buffer has valid audio data
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Empty audio buffer');
      }

      // Create a temporary file with proper extension
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`);
      
      try {
        // Write buffer to temp file
        fs.writeFileSync(tempFile, audioBuffer);
        
        // Verify file was created and has content
        const stats = fs.statSync(tempFile);
        if (stats.size === 0) {
          throw new Error('Created empty audio file');
        }
        
        // Check minimum file size (at least 1KB for valid audio)
        if (stats.size < 1000) {
          throw new Error(`Audio file too small (${stats.size} bytes) - need at least 1KB`);
        }
        
        // Check maximum file size (prevent huge files that cause errors)
        const maxSize = 200000; // ~200KB max (~30 seconds of audio)
        if (stats.size > maxSize) {
          throw new Error(`Audio file too large (${stats.size} bytes, max ${maxSize}). Please send shorter segments.`);
        }
        
        console.log(`📤 Uploading audio file to AssemblyAI (${stats.size} bytes, ~${Math.round(stats.size / 7000)}s)...`);
        
        // Upload and transcribe using AssemblyAI with retry logic
        // Note: WebM chunks from MediaRecorder might not always form valid files
        // We'll retry on transcoding errors and network failures
        let finalTranscript = null;
        let retryCount = 0;
        const maxRetries = 3; // Increased retries for network issues
        
        while (retryCount <= maxRetries) {
          try {
            // AssemblyAI SDK requires a file path or URL, not a buffer directly
            // So we use the temp file we created
            const transcript = await Promise.race([
              client.transcripts.transcribe({
                audio: tempFile,
                ...config
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
              )
            ]);

            // Wait for transcription to complete (poll if needed)
            finalTranscript = transcript;
            let pollCount = 0;
            const maxPolls = 60; // Maximum 60 seconds wait time
            
            while ((finalTranscript.status === 'queued' || finalTranscript.status === 'processing') && pollCount < maxPolls) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
              try {
                finalTranscript = await Promise.race([
                  client.transcripts.get(finalTranscript.id),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Polling timeout')), 5000)
                  )
                ]);
                pollCount++;
              } catch (pollError) {
                // If it's a network error, retry polling
                if (pollError.message && (pollError.message.includes('fetch failed') || pollError.message.includes('timeout'))) {
                  if (pollCount < maxPolls - 5) { // Allow a few retries for polling
                    console.log(`⚠️ Network error while polling, retrying... (poll attempt ${pollCount + 1})`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                  }
                }
                console.error('Error polling transcript:', pollError.message);
                throw pollError;
              }
            }
            
            if (pollCount >= maxPolls) {
              throw new Error('Transcription timeout - took too long to complete');
            }

            // Check for errors
            if (finalTranscript.status === 'error') {
              const errorMsg = finalTranscript.error || 'Transcription failed';
              // If it's a transcoding error and we haven't retried, try again
              if (errorMsg.includes('Transcoding failed') && retryCount < maxRetries) {
                console.log(`⚠️ Transcoding error detected, retrying... (attempt ${retryCount + 1}/${maxRetries + 1})`);
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
                continue;
              }
              // If we've exhausted retries, throw the error
              throw new Error(errorMsg);
            }
            
            // Success - break out of retry loop
            break;
          } catch (error) {
            const errorMessage = error.message || error.toString();
            const isNetworkError = errorMessage.includes('fetch failed') || 
                                   errorMessage.includes('timeout') ||
                                   errorMessage.includes('ECONNREFUSED') ||
                                   errorMessage.includes('ENOTFOUND') ||
                                   errorMessage.includes('network');
            
            // If it's a network error and we haven't retried enough, try again
            if (isNetworkError && retryCount < maxRetries) {
              const waitTime = Math.min(2000 * (retryCount + 1), 10000); // Exponential backoff, max 10s
              console.log(`⚠️ Network error (${errorMessage}), retrying in ${waitTime}ms... (attempt ${retryCount + 1}/${maxRetries + 1})`);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
            
            // If it's a transcoding error and we haven't retried, try again
            if (errorMessage.includes('Transcoding failed') && retryCount < maxRetries) {
              console.log(`⚠️ Transcoding error, retrying... (attempt ${retryCount + 1}/${maxRetries + 1})`);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
              continue;
            }
            
            // Otherwise, throw the error
            throw error;
          }
        }

        // Clean up temp file
        if (fs.existsSync(tempFile)) {
          try {
            fs.unlinkSync(tempFile);
          } catch (unlinkError) {
            // Ignore cleanup errors
          }
        }

        if (!finalTranscript) {
          throw new Error('Failed to get transcript after retries');
        }

        if (!finalTranscript.text) {
          return {
            transcript: '',
            confidence: 0,
            alternatives: []
          };
        }

        return {
          transcript: finalTranscript.text.trim(),
          confidence: finalTranscript.confidence || 0.95,
          alternatives: finalTranscript.words ? finalTranscript.words.map(w => w.text).join(' ') : []
        };
      } catch (fileError) {
        // Clean up temp file if it exists
        if (fs.existsSync(tempFile)) {
          try {
            fs.unlinkSync(tempFile);
          } catch (unlinkError) {
            // Ignore cleanup errors
          }
        }
        throw fileError;
      }
    } catch (error) {
      const errorMessage = error.message || error.toString();
      const isNetworkError = errorMessage.includes('fetch failed') || 
                             errorMessage.includes('timeout') ||
                             errorMessage.includes('ECONNREFUSED') ||
                             errorMessage.includes('ENOTFOUND') ||
                             errorMessage.includes('network') ||
                             (error.cause && (error.cause.message?.includes('fetch failed') || error.cause.message?.includes('timeout')));
      
      console.error('AssemblyAI transcription error:', errorMessage);
      
      // Log more details for debugging
      if (error.response) {
        console.error('API Response Status:', error.response.status);
        console.error('API Response Data:', JSON.stringify(error.response.data));
      }
      if (error.status) {
        console.error('Error Status:', error.status);
      }
      if (error.cause) {
        console.error('Caused by:', error.cause.message);
        if (error.cause.stack) {
          const stackLines = error.cause.stack.split('\n').slice(0, 3);
          stackLines.forEach(line => console.error(line));
        }
      }
      if (error.stack) {
        const stackLines = error.stack.split('\n').slice(0, 6);
        stackLines.forEach(line => console.error(line));
      }
      
      // Provide more specific error message
      let finalErrorMessage = 'Speech-to-Text transcription failed';
      if (isNetworkError) {
        finalErrorMessage = 'Network error: Unable to connect to AssemblyAI. Please check your internet connection and try again.';
      } else if (error.message) {
        finalErrorMessage = error.message;
      } else if (error.response?.data?.error) {
        finalErrorMessage = error.response.data.error;
      }
      
      throw new Error(finalErrorMessage);
    }
  }

  /**
   * Real-time streaming transcription using AssemblyAI
   * @param {ReadableStream} audioStream - Audio stream
   * @param {string} languageCode - Language code
   * @param {Function} onTranscript - Callback for transcript updates
   * @returns {Promise<Object>} Realtime transcript object
   */
  async streamingRecognize(audioStream, languageCode = 'en', onTranscript) {
    // Lazy initialization - ensure client is initialized
    const client = this.initializeClient();
    if (!client) {
      throw new Error('AssemblyAI client not initialized. Please set ASSEMBLYAI_API_KEY in your .env file.');
    }

    try {
      const config = {
        language_code: this.mapLanguageCode(languageCode),
        punctuate: true,
        format_text: true,
      };

      // Create realtime transcript
      const rt = client.realtime.transcriber({
        sample_rate: 16000, // AssemblyAI realtime requires 16kHz
        ...config
      });

      // Handle transcript events
      rt.on('transcript', (transcript) => {
        if (transcript.text) {
          onTranscript(transcript.text, transcript.final);
        }
      });

      rt.on('error', (error) => {
        console.error('Realtime transcription error:', error.message);
        throw error;
      });

      // Connect and start streaming
      await rt.connect();
      
      // Pipe audio stream to realtime transcriber
      audioStream.pipe(rt.stream());

      return rt;
    } catch (error) {
      console.error('Streaming recognition error:', error.message);
      if (error.stack) {
        const stackLines = error.stack.split('\n').slice(0, 4);
        stackLines.forEach(line => console.error(line));
      }
      throw new Error('Streaming recognition failed');
    }
  }

  /**
   * Map language codes to AssemblyAI format
   * @param {string} languageCode - Language code (e.g., 'en-US', 'es-ES')
   * @returns {string} AssemblyAI language code (e.g., 'en', 'es')
   */
  mapLanguageCode(languageCode) {
    // AssemblyAI uses ISO 639-1 codes (2 letters)
    const languageMap = {
      'en': 'en',
      'en-US': 'en',
      'en-GB': 'en',
      'es': 'es',
      'es-ES': 'es',
      'es-MX': 'es',
      'fr': 'fr',
      'fr-FR': 'fr',
      'de': 'de',
      'de-DE': 'de',
      'it': 'it',
      'it-IT': 'it',
      'pt': 'pt',
      'pt-BR': 'pt',
      'pt-PT': 'pt',
      'zh': 'zh',
      'zh-CN': 'zh',
      'ja': 'ja',
      'ja-JP': 'ja',
      'ko': 'ko',
      'ko-KR': 'ko',
      'ar': 'ar',
      'hi': 'hi',
      'ru': 'ru',
      'ru-RU': 'ru',
    };

    // Extract base language code
    const baseCode = languageCode.split('-')[0].toLowerCase();
    return languageMap[languageCode] || languageMap[baseCode] || 'en';
  }

  /**
   * Enhance medical transcription (placeholder - can use AI for medical term correction)
   */
  async enhanceMedicalTranscription(transcript) {
    // This can be enhanced using Gemini API for medical term correction
    // For now, return as-is
    return transcript;
  }
}

export default new SpeechService();
