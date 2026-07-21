const AIProvider = require('./providerInterface');
const { makeRequest } = require('./httpClient');

/**
 * Gemini API Provider implementation (REST-based)
 */
class GeminiProvider extends AIProvider {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    super();
    this.apiKey = apiKey;
    if (!apiKey) {
      console.warn('[GeminiProvider] API Key is missing. Gemini services will fail.');
    }
  }

  /**
   * Generates a conversational reply.
   */
  async generateReply(messages, options = {}) {
    const model = options.model || 'gemini-1.5-flash';
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const systemPrompt = options.systemPrompt || '';
    const isJson = options.responseFormat === 'json';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const contents = messages.map(m => {
      const role = m.sender === 'customer' || m.sender === 'user' ? 'user' : 'model';
      return {
        role,
        parts: [{ text: m.text }]
      };
    });

    const payload = {
      contents,
      generationConfig: {
        temperature
      }
    };

    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }]
      };
    }

    if (isJson) {
      payload.generationConfig.responseMimeType = 'application/json';
    }

    try {
      const response = await makeRequest(url, 'POST', {}, payload);
      if (response.status !== 200) {
        throw new Error(`Gemini API returned status ${response.status}: ${JSON.stringify(response.data || response.raw)}`);
      }

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini API returned empty text response');
      }

      return {
        reply: text,
        raw: response.data
      };
    } catch (error) {
      console.error('[GeminiProvider generateReply Error]:', error.message);
      throw error;
    }
  }

  /**
   * Generates a vector embedding array.
   */
  async generateEmbedding(text) {
    const model = 'text-embedding-004';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${this.apiKey}`;

    const payload = {
      model: `models/${model}`,
      content: {
        parts: [{ text }]
      }
    };

    try {
      const response = await makeRequest(url, 'POST', {}, payload);
      if (response.status !== 200) {
        throw new Error(`Gemini Embedding API returned status ${response.status}`);
      }

      const embeddingValues = response.data?.embedding?.values;
      if (!embeddingValues) {
        throw new Error('Gemini Embedding API returned empty values');
      }

      return embeddingValues;
    } catch (error) {
      console.error('[GeminiProvider generateEmbedding Error]:', error.message);
      throw error;
    }
  }

  /**
   * Vision: processes image buffer alongside prompt.
   */
  async vision(imageBuffer, prompt, mimeType = 'image/jpeg') {
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: imageBuffer.toString('base64')
              }
            }
          ]
        }
      ]
    };

    try {
      const response = await makeRequest(url, 'POST', {}, payload);
      if (response.status !== 200) {
        throw new Error(`Gemini Vision API returned status ${response.status}`);
      }

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini Vision API returned empty text response');
      }

      return text;
    } catch (error) {
      console.error('[GeminiProvider vision Error]:', error.message);
      throw error;
    }
  }
}

module.exports = GeminiProvider;
