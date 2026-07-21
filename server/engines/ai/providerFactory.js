const { getDB } = require('../../db');
const OpenAIProvider = require('./openaiProvider');
const GeminiProvider = require('./geminiProvider');
const ClaudeProvider = require('./claudeProvider');
const DeepSeekProvider = require('./deepseekProvider');
const OllamaProvider = require('./ollamaProvider');

/**
 * Provider Factory
 * Resolves the active AI provider and configurations dynamically from database settings.
 */
class ProviderFactory {
  /**
   * Instantiates the active provider and returns configuration metrics for a company.
   * @param {string} companyId - Business ID
   * @returns {Promise<{ provider: Object, model: string, settings: Object }>}
   */
  static async getProviderForCompany(companyId) {
    const db = getDB();
    let providerName = 'openai';
    let modelName = 'gpt-3.5-turbo';
    let settings = {};

    try {
      const aiSettings = await db.ai_settings.findOne({ companyId });
      if (aiSettings) {
        providerName = aiSettings.provider || 'openai';
        modelName = aiSettings.model || modelName;
        settings = aiSettings;
      }
    } catch (err) {
      console.warn('[ProviderFactory] Failed to read AI settings from DB, using defaults:', err.message);
    }

    let providerInstance;

    switch (providerName.toLowerCase()) {
      case 'gemini':
        const geminiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
        providerInstance = new GeminiProvider(geminiKey);
        if (!settings.model) modelName = 'gemini-1.5-flash';
        break;
      case 'claude':
        const claudeKey = settings.claudeApiKey || process.env.ANTHROPIC_API_KEY;
        providerInstance = new ClaudeProvider(claudeKey);
        if (!settings.model) modelName = 'claude-3-5-sonnet-20240620';
        break;
      case 'deepseek':
        providerInstance = new DeepSeekProvider(process.env.DEEPSEEK_API_KEY);
        if (!settings.model) modelName = 'deepseek-chat';
        break;
      case 'ollama':
        providerInstance = new OllamaProvider(process.env.OLLAMA_BASE_URL);
        if (!settings.model) modelName = 'llama3';
        break;
      case 'openai':
      default:
        const openaiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;
        providerInstance = new OpenAIProvider(openaiKey);
        if (!settings.model) modelName = 'gpt-3.5-turbo';
        break;
    }

    return {
      provider: providerInstance,
      model: modelName,
      settings
    };
  }
}

module.exports = ProviderFactory;
