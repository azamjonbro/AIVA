const AIProvider = require('./providerInterface');
const { makeRequest } = require('./httpClient');

/**
 * DeepSeek API Provider implementation (REST-based, OpenAI compatible)
 */
class DeepSeekProvider extends AIProvider {
  constructor(apiKey = process.env.DEEPSEEK_API_KEY) {
    super();
    this.apiKey = apiKey;
    if (!apiKey) {
      console.warn('[DeepSeekProvider] API Key is missing. DeepSeek services will fail.');
    }
  }

  /**
   * Generates a conversational reply.
   */
  async generateReply(messages, options = {}) {
    const model = options.model || 'deepseek-chat';
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const systemPrompt = options.systemPrompt || '';
    const isJson = options.responseFormat === 'json';

    const url = 'https://api.deepseek.com/chat/completions';
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`
    };

    const apiMessages = [];
    if (systemPrompt) {
      apiMessages.push({ role: 'system', content: systemPrompt });
    }

    messages.forEach(m => {
      const role = m.sender === 'customer' || m.sender === 'user' ? 'user' : 'assistant';
      apiMessages.push({ role, content: m.text });
    });

    const payload = {
      model,
      messages: apiMessages,
      temperature
    };

    if (isJson) {
      payload.response_format = { type: 'json_object' };
    }

    try {
      const response = await makeRequest(url, 'POST', headers, payload);
      if (response.status !== 200) {
        throw new Error(`DeepSeek API returned status ${response.status}: ${JSON.stringify(response.data || response.raw)}`);
      }

      const text = response.data?.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('DeepSeek API returned empty content');
      }

      return {
        reply: text,
        raw: response.data
      };
    } catch (error) {
      console.error('[DeepSeekProvider generateReply Error]:', error.message);
      throw error;
    }
  }
}

module.exports = DeepSeekProvider;
