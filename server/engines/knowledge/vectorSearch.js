const { getDB } = require('../../db');

/**
 * Computes cosine similarity between two vectors.
 * @param {Array<number>} vecA
 * @param {Array<number>} vecB
 * @returns {number} Similarity score between -1 and 1
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Semantic & Vector Search Engine for Company Knowledge Base
 */
class VectorSearch {
  /**
   * Search knowledge base using semantic cosine-similarity on vector embeddings.
   * Falls back to keyword search if query embedding fails or dimensions mismatch.
   * @param {string} companyId - Business ID
   * @param {string} queryText - Customer message / question
   * @param {Object} provider - Instance of active AIProvider (OpenAI, Gemini, etc.)
   * @param {Object} [options] - Search options (limit, threshold)
   * @returns {Promise<Array<Object>>} Sorted list of matching knowledge entries with score
   */
  static async searchKnowledge(companyId, queryText, provider, options = {}) {
    const limit = options.limit || 3;
    const threshold = options.threshold !== undefined ? options.threshold : 0.70; // 70% match threshold
    const db = getDB();

    try {
      const items = await db.knowledge.find({ companyId, approvalStatus: { $ne: 'rejected' } });
      if (items.length === 0) return [];

      let queryEmbedding = null;
      if (provider && typeof provider.generateEmbedding === 'function') {
        try {
          queryEmbedding = await provider.generateEmbedding(queryText);
        } catch (embErr) {
          console.warn('[VectorSearch] Failed to generate query embedding, falling back to hybrid/keyword matching:', embErr.message);
        }
      }

      const results = [];

      for (const item of items) {
        let score = 0;
        let method = 'keyword';

        // Attempt vector semantic match first
        if (queryEmbedding && Array.isArray(item.embedding) && item.embedding.length === queryEmbedding.length) {
          score = cosineSimilarity(queryEmbedding, item.embedding);
          method = 'vector';
        } else {
          // Fallback keyword/string similarity if embeddings are not available or dimensions mismatch
          const { calculateSimilarity } = require('../../services/knowledgeEngine');
          const scoreTitle = calculateSimilarity(queryText, item.title || '');
          const scoreQuestion = calculateSimilarity(queryText, item.question || '');
          const scoreNormalized = calculateSimilarity(queryText, item.normalizedQuestion || '');
          
          // Map 0-100 score to 0-1 range
          score = Math.max(scoreTitle, scoreQuestion, scoreNormalized) / 100;
          method = 'fallback_levenshtein';
        }

        results.push({
          item,
          score,
          method
        });
      }

      // Filter and sort results descending by score
      return results
        .filter(r => r.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(r => ({
          ...r.item,
          searchScore: Math.round(r.score * 100),
          searchMethod: r.method
        }));
    } catch (error) {
      console.error('[VectorSearch searchKnowledge Error]:', error.message);
      return [];
    }
  }
}

module.exports = VectorSearch;
