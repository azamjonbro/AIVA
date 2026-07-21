const { OpenAI } = require('openai');
const AIProvider = require('./providerInterface');

/**
 * OpenAI API Provider implementation
 */
class OpenAIProvider extends AIProvider {
  constructor(apiKey = process.env.OPENAI_API_KEY) {
    super();
    if (!apiKey) {
      console.warn('[OpenAIProvider] API Key is missing. OpenAI services will fail if key is not provided.');
      this.client = null;
    } else {
      this.client = new OpenAI({ apiKey });
    }
  }

  /**
   * Generates a conversational reply.
   */
  async generateReply(messages, options = {}) {
    const model = options.model || 'gpt-3.5-turbo';
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const systemPrompt = options.systemPrompt || '';
    const isJson = options.responseFormat === 'json';

    const apiMessages = [];
    if (systemPrompt) {
      apiMessages.push({ role: 'system', content: systemPrompt });
    }

    messages.forEach(m => {
      // Map sender to role
      const role = m.sender === 'customer' || m.sender === 'user' ? 'user' : 'assistant';
      apiMessages.push({ role, content: m.text });
    });

    const requestPayload = {
      model,
      messages: apiMessages,
      temperature
    };

    if (isJson) {
      requestPayload.response_format = { type: 'json_object' };
    }

    try {
      const response = await this.client.chat.completions.create(requestPayload);
      const text = response.choices[0].message.content;
      return {
        reply: text,
        raw: response
      };
    } catch (error) {
      console.error('[OpenAIProvider generateReply Error]:', error.message);
      throw error;
    }
  }

  /**
   * Generates a vector embedding array.
   */
  async generateEmbedding(text) {
    const model = 'text-embedding-3-small';
    try {
      const response = await this.client.embeddings.create({
        model,
        input: text
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('[OpenAIProvider generateEmbedding Error]:', error.message);
      throw error;
    }
  }

  /**
   * Vision: processes image buffer alongside prompt.
   */
  async vision(imageBuffer, prompt, mimeType = 'image/jpeg') {
    const model = 'gpt-4o';
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ]
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('[OpenAIProvider vision Error]:', error.message);
      throw error;
    }
  }

  /**
   * Speech-to-Text: transcribe audio.
   */
  async speechToText(audioBuffer, language = 'uz') {
    try {
      // Use openai.toFile helper if available, or create a mock file object
      const file = await OpenAI.toFile(audioBuffer, 'speech.mp3');
      const response = await this.client.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: language
      });
      return response.text;
    } catch (error) {
      console.error('[OpenAIProvider speechToText Error]:', error.message);
      throw error;
    }
  }

  /**
   * Text-to-Speech: synthesize audio buffer.
   */
  async textToSpeech(text, options = {}) {
    const model = options.model || 'tts-1';
    const voice = options.voice || 'alloy';

    try {
      const response = await this.client.audio.speech.create({
        model,
        voice,
        input: text
      });
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (error) {
      console.error('[OpenAIProvider textToSpeech Error]:', error.message);
      throw error;
    }
  }
}

module.exports = OpenAIProvider;
