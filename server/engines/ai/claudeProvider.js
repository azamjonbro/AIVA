const AIProvider = require('./providerInterface');
const { makeRequest } = require('./httpClient');

/**
 * Anthropic Claude API Provider implementation (REST-based)
 */
class ClaudeProvider extends AIProvider {
  constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
    super();
    this.apiKey = apiKey;
    if (!apiKey) {
      console.warn('[ClaudeProvider] API Key is missing. Claude services will fail.');
    }
  }

  /**
   * Generates a conversational reply.
   */
  async generateReply(messages, options = {}) {
    const model = options.model || 'claude-3-5-sonnet-20240620';
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const systemPrompt = options.systemPrompt || '';
    const maxTokens = options.maxTokens || 1024;

    const url = 'https://api.anthropic.com/v1/messages';
    const headers = {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01'
    };

    const formattedMessages = messages.map(m => {
      const role = m.sender === 'customer' || m.sender === 'user' ? 'user' : 'assistant';
      return {
        role,
        content: m.text
      };
    });

    const payload = {
      model,
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    try {
      const response = await makeRequest(url, 'POST', headers, payload);
      if (response.status !== 200) {
        throw new Error(`Claude API returned status ${response.status}: ${JSON.stringify(response.data || response.raw)}`);
      }

      const text = response.data?.content?.[0]?.text;
      if (!text) {
        throw new Error('Claude API returned empty response content');
      }

      return {
        reply: text,
        raw: response.data
      };
    } catch (error) {
      console.error('[ClaudeProvider generateReply Error]:', error.message);
      throw error;
    }
  }

  /**
   * Vision: processes image buffer alongside prompt.
   */
  async vision(imageBuffer, prompt, mimeType = 'image/jpeg') {
    const model = 'claude-3-5-sonnet-20240620';
    const url = 'https://api.anthropic.com/v1/messages';
    const headers = {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01'
    };

    const base64Image = imageBuffer.toString('base64');

    const payload = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ],
      max_tokens: 1024
    };

    try {
      const response = await makeRequest(url, 'POST', headers, payload);
      if (response.status !== 200) {
        throw new Error(`Claude Vision API returned status ${response.status}`);
      }

      const text = response.data?.content?.[0]?.text;
      if (!text) {
        throw new Error('Claude Vision API returned empty text response');
      }

      return text;
    } catch (error) {
      console.error('[ClaudeProvider vision Error]:', error.message);
      throw error;
    }
  }
}

module.exports = ClaudeProvider;
