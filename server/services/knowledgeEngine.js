const stopwords = new Set([
  // English
  'the', 'is', 'are', 'a', 'an', 'that', 'how', 'when', 'who', 'where', 'what', 'why', 'can', 'you', 'your', 'my', 'me', 'with', 'for', 'to', 'hello', 'hi',
  // Russian
  'это', 'как', 'когда', 'кто', 'что', 'где', 'почему', 'есть', 'был', 'была', 'было', 'были', 'для', 'или', 'этот', 'эта', 'это', 'привет',
  // Uzbek
  'bu', 'da', 'dan', 'bilan', 'uchun', 'qanday', 'qachon', 'kim', 'nima', 'qayerda', 'esa', 'bor', 'yoq', 'mi', 'emas', 'u', 'men', 'sen', 'salom', 'bormi'
]);

const categoriesKeywords = {
  Telegram: ['telegram', 'tg', 'telegrams', 'телега', 'телеграм'],
  Instagram: ['instagram', 'ig', 'insta', 'инстаграм', 'инста'],
  WhatsApp: ['whatsapp', 'wa', 'ватсап', 'ватцап'],
  CRM: ['crm', 'lead', 'leads', 'deal', 'deals', 'funnel', 'stage', 'status'],
  Automation: ['automation', 'automate', 'bot', 'poller', 'webhook', 'webhooks', 'автоматизация'],
  AI: ['ai', 'openai', 'chatgpt', 'gpt', 'embedding', 'vector', 'reasoning', 'intelligence'],
  Sales: ['sales', 'spin', 'bant', 'upsell', 'cross', 'price', 'pricing', 'close', 'probability'],
  Billing: ['billing', 'payment', 'card', 'checkout', 'payme', 'click', 'cash', 'money', 'price', 'plan', 'tariff'],
  Security: ['security', 'token', 'secret', 'password', 'key', 'auth', 'private', 'safe', 'safety']
};

/**
 * Normalizes text to prepare it for search indexing or classification.
 */
const normalizeQuestion = (text = '') => {
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\sа-яА-ЯёЁўЎқҚғҒҳҲ]/g, ' ') // support Cyrillic / Uzbek chars
    .replace(/\s+/g, ' ')
    .trim();
    
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  const keywords = words.filter(w => !stopwords.has(w));
  
  return { normalized, keywords };
};

/**
 * Computes the Levenshtein distance between two strings.
 */
const getLevenshteinDistance = (s1, s2) => {
  const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return track[s2.length][s1.length];
};

/**
 * Calculates a similarity score using Levenshtein distance.
 */
const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase().replace(/[^\w\sа-яА-ЯёЁўЎқҚғҒҳҲ]/g, '').replace(/\s+/g, ' ').trim();
  const s2 = str2.toLowerCase().replace(/[^\w\sа-яА-ЯёЁўЎқҚғҒҳҲ]/g, '').replace(/\s+/g, ' ').trim();
  
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;
  
  const maxLength = Math.max(s1.length, s2.length);
  const distance = getLevenshteinDistance(s1, s2);
  
  const score = ((maxLength - distance) / maxLength) * 100;
  return Math.min(Math.round(score), 100);
};

/**
 * Perform a hybrid keyword-semantic query against stored company knowledge.
 */
const findSimilarKnowledge = async (db, companyId, queryText, provider = null) => {
  const { normalized } = normalizeQuestion(queryText);
  if (!normalized) return { match: null, score: 0 };
  
  // If provider is available, use our vector search engine
  if (provider) {
    try {
      const VectorSearch = require('../engines/knowledge/vectorSearch');
      const matches = await VectorSearch.searchKnowledge(companyId, queryText, provider, { limit: 1 });
      if (matches.length > 0) {
        return { match: matches[0], score: matches[0].searchScore };
      }
    } catch (err) {
      console.warn('[knowledgeEngine findSimilarKnowledge Vector Error]:', err.message);
    }
  }

  // Fallback to Levenshtein similarity search
  const items = await db.knowledge.find({ companyId, approvalStatus: { $ne: 'rejected' } });
  let bestMatch = null;
  let maxScore = 0;
  
  for (const item of items) {
    const scoreTitle = calculateSimilarity(normalized, item.title || '');
    const scoreQuestion = calculateSimilarity(normalized, item.question || '');
    const scoreNormalized = calculateSimilarity(normalized, item.normalizedQuestion || '');
    
    const score = Math.max(scoreTitle, scoreQuestion, scoreNormalized);
    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }
  
  return { match: bestMatch, score: maxScore };
};

/**
 * Categorize the Q&A pair based on keyword mapping tags.
 */
const autoClassifyCategory = (text = '') => {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(categoriesKeywords)) {
    if (keywords.some(k => lower.includes(k))) {
      return category;
    }
  }
  return 'General';
};

/**
 * Filter out sensitive personal details, passwords, and tokens before indexing knowledge.
 */
const sanitizePII = (text = '') => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const cardRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  // Specific regex to strip words following password/pass/pwd/token/key matches (minimum 5 chars)
  const tokenRegex = /(password|pass|pwd|secret|token|key)[:=\s]+(?:is\s+)?([a-zA-Z0-9_\-\.]{5,})/gi;
  // Strip phone numbers with format validation (exclude simple digits within keys)
  const phoneRegex = /(\+?\d[\d-\s()]{8,15}\d)/g;

  let sanitized = text;
  sanitized = sanitized.replace(emailRegex, '[EMAIL_SECURED]');
  sanitized = sanitized.replace(tokenRegex, '$1: [TOKEN_SECURED]');
  sanitized = sanitized.replace(cardRegex, '[CARD_SECURED]');
  
  // Avoid replacing digits embedded in longer token names
  sanitized = sanitized.replace(phoneRegex, (match) => {
    // If it's a very long string without spacing (like a token), don't treat as phone
    if (match.length > 15 && !match.includes(' ') && !match.includes('-')) {
      return match;
    }
    return '[PHONE_SECURED]';
  });

  return sanitized;
};

/**
 * Detect language of query (en, ru, uz)
 */
const detectLanguage = (text = '') => {
  const uzKeywords = ['bormi', 'narxi', 'qancha', 'salom', 'olaman', 'sotib', 'yetkaz', 'telfon', 'tel', 'кафолат', 'ассалом', 'қанча', 'ўзбекистон', 'сотиб', 'ассалому'];
  const ruKeywords = ['есть', 'цена', 'сколько', 'привет', 'хочу', 'купить', 'доставка', 'телефон', 'номер', 'здравствуйте', 'заказать'];
  const lower = text.toLowerCase();
  
  if (uzKeywords.some(w => lower.includes(w))) return 'uz';
  if (ruKeywords.some(w => lower.includes(w))) return 'ru';
  return 'en';
};

/**
 * Save new AI generated answer to build up knowledge dynamically.
 * Implements deduplication and sanitization checks.
 */
const autoGrowKnowledge = async (db, companyId, questionText, answerText, customStatus = 'pending', customSource = 'ai_generation', provider = null) => {
  // 1. Sanitize text for security
  const cleanQuestion = sanitizePII(questionText);
  const cleanAnswer = sanitizePII(answerText);
  
  const { normalized, keywords } = normalizeQuestion(cleanQuestion);
  if (!normalized || cleanAnswer.length < 5) return null;
  
  // 2. Perform duplicate detection
  const { match, score } = await findSimilarKnowledge(db, companyId, cleanQuestion, provider);
  
  if (match && score >= 80) {
    console.log(`[Knowledge Engine] Duplicate found with similarity score ${score}%. Increasing usage count.`);
    const newCount = (match.usageCount || 1) + 1;
    const updates = {
      usageCount: newCount,
      lastUsed: new Date()
    };
    
    // If the new answer is significantly longer/better and current status is not locked/approved, update it
    if (match.approvalStatus === 'pending' && cleanAnswer.length > (match.content || '').length) {
      updates.content = cleanAnswer;
    }
    
    // Promote approvalStatus if human verified
    if (customStatus === 'verified') {
      updates.approvalStatus = 'verified';
    }
    
    await db.knowledge.findByIdAndUpdate(match.id, updates);
    
    // Refresh document from DB to return accurate counts
    const updatedDoc = await db.knowledge.findById(match.id);
    return updatedDoc;
  }
  
  // 3. Define new entry metrics
  const category = autoClassifyCategory(cleanQuestion);
  const language = detectLanguage(cleanQuestion);
  
  // Generate real embedding vector if provider is available
  let embedding = Array.from({ length: 1536 }, () => 0);
  if (provider && typeof provider.generateEmbedding === 'function') {
    try {
      embedding = await provider.generateEmbedding(cleanQuestion);
    } catch (err) {
      console.warn('[Knowledge Engine] Failed to generate embedding for new grow entry:', err.message);
    }
  }
  
  console.log(`[Knowledge Engine] Creating new ${customStatus} knowledge entry for company: ${companyId}`);
  const newEntry = await db.knowledge.create({
    title: cleanQuestion.substring(0, 100),
    content: cleanAnswer,
    type: 'verified_answer',
    companyId,
    question: cleanQuestion,
    normalizedQuestion: normalized,
    embedding,
    keywords,
    category,
    tags: keywords.slice(0, 5),
    language,
    confidence: 85,
    source: customSource,
    lastUsed: new Date(),
    usageCount: 1,
    feedbackHelpful: 0,
    feedbackNotHelpful: 0,
    approvalStatus: customStatus
  });
  
  return newEntry;
};

module.exports = {
  normalizeQuestion,
  calculateSimilarity,
  findSimilarKnowledge,
  autoGrowKnowledge
};
