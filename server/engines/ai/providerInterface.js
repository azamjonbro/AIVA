/**
 * Abstract AI Provider Interface
 * All model providers (OpenAI, Claude, Gemini, DeepSeek, Ollama) must extend this class
 * and implement its methods to ensure modular compatibility.
 */
class AIProvider {
  /**
   * Generates a conversational reply based on the given messages.
   * @param {Array<Object>} messages - Array of message objects: [{ sender: 'customer'|'ai', text: string }]
   * @param {Object} [options] - Generation options (temperature, systemPrompt, maxTokens, etc.)
   * @returns {Promise<Object>} Object containing: { reply: string, raw: any }
   */
  async generateReply(messages, options = {}) {
    throw new Error('Method generateReply() must be implemented by the provider subclass.');
  }

  /**
   * Generates a vector embedding array for the given input text.
   * @param {string} text - Text to embed
   * @returns {Promise<Array<number>>} Array of numbers (e.g. 1536 dimensions for OpenAI)
   */
  async generateEmbedding(text) {
    throw new Error('Method generateEmbedding() must be implemented by the provider subclass.');
  }

  /**
   * Processes an image input alongside a textual prompt (Vision).
   * @param {Buffer} imageBuffer - Binary buffer of the image
   * @param {string} prompt - Question/prompt about the image
   * @param {string} [mimeType] - Image MIME type (e.g. 'image/jpeg')
   * @returns {Promise<string>} Textual analysis result
   */
  async vision(imageBuffer, prompt, mimeType = 'image/jpeg') {
    throw new Error('Method vision() must be implemented by the provider subclass.');
  }

  /**
   * Converts speech (audio) to text (Transcription).
   * @param {Buffer} audioBuffer - Audio file binary buffer
   * @param {string} [language] - Optional ISO language code
   * @returns {Promise<string>} Transcribed text
   */
  async speechToText(audioBuffer, language = 'uz') {
    throw new Error('Method speechToText() must be implemented by the provider subclass.');
  }

  /**
   * Converts text to speech (Synthesis).
   * @param {string} text - Text to synthesize
   * @param {Object} [options] - Synthesis options (voice, format)
   * @returns {Promise<Buffer>} Audio binary buffer
   */
  async textToSpeech(text, options = {}) {
    throw new Error('Method textToSpeech() must be implemented by the provider subclass.');
  }
}

module.exports = AIProvider;
