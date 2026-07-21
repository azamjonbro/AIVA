const AIProvider = require('./providerInterface');
const { makeRequest } = require('./httpClient');

/**
 * Local Ollama API Provider implementation (REST-based)
 */
class OllamaProvider extends AIProvider {
  constructor(baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434') {
    super();
    this.baseUrl = baseUrl;
  }

  /**
   * Generates a conversational reply.
   */
  async generateReply(messages, options = {}) {
    const model = options.model || 'llama3';
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const systemPrompt = options.systemPrompt || '';

    const url = `${this.baseUrl}/api/chat`;

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
      stream: false,
      options: {
        temperature
      }
    };

    try {
      const response = await makeRequest(url, 'POST', {}, payload);
      if (response.status !== 200) {
        throw new Error(`Ollama API returned status ${response.status}: ${JSON.stringify(response.data || response.raw)}`);
      }

      const text = response.data?.message?.content;
      if (!text) {
        throw new Error('Ollama API returned empty content');
      }

      return {
        reply: text,
        raw: response.data
      };
    } catch (error) {
      console.error('[OllamaProvider generateReply Error]:', error.message);
      throw error;
    }
  }

  /**
   * Generates a vector embedding array.
   */
  async generateEmbedding(text) {
    const model = 'nomic-embed-text';
    const url = `${this.baseUrl}/api/embeddings`;

    const payload = {
      model,
      prompt: text
    };

    try {
      const response = await makeRequest(url, 'POST', {}, payload);
      if (response.status !== 200) {
        throw new Error(`Ollama Embedding API returned status ${response.status}`);
      }

      const embeddingValues = response.data?.embedding;
      if (!embeddingValues) {
        throw new Error('Ollama Embedding API returned empty embedding array');
      }

      return embeddingValues;
    } catch (error) {
      console.error('[OllamaProvider generateEmbedding Error]:', error.message);
      throw error;
    }
  }
}

module.exports = OllamaProvider;
