const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_DIR = path.join(__dirname, 'data');
const JSON_DB_PATH = path.join(DATA_DIR, 'db.json');

let useLocalDB = false;

// Ensure local data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ----------------------------------------------------
// Local JSON DB Engine Implementation
// ----------------------------------------------------
const loadLocalDB = () => {
  if (!fs.existsSync(JSON_DB_PATH)) {
    // Seed default structures
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify({
      users: [],
      companies: [],
      products: [],
      conversations: [],
      leads: []
    }, null, 2));
  }
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading JSON DB:', error);
    return { users: [], companies: [], products: [], conversations: [], leads: [] };
  }
};

const saveLocalDB = (data) => {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving JSON DB:', error);
  }
};

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Helper helper to filter items matching a query
const matchQuery = (item, query) => {
  for (const key in query) {
    if (query[key] && typeof query[key] === 'object' && query[key].$or) {
      const match = query[key].$or.some(subQuery => matchQuery(item, subQuery));
      if (!match) return false;
      continue;
    }
    if (item[key] !== query[key]) return false;
  }
  return true;
};

const localCollection = (collectionName) => {
  return {
    find: async (query = {}) => {
      const db = loadLocalDB();
      const items = db[collectionName] || [];
      return items.filter(item => matchQuery(item, query));
    },
    findOne: async (query = {}) => {
      const db = loadLocalDB();
      const items = db[collectionName] || [];
      return items.find(item => matchQuery(item, query)) || null;
    },
    findById: async (id) => {
      const db = loadLocalDB();
      const items = db[collectionName] || [];
      return items.find(item => item.id === id) || null;
    },
    create: async (data) => {
      const db = loadLocalDB();
      if (!db[collectionName]) db[collectionName] = [];
      const newRecord = { id: generateId(), ...data, createdAt: new Date().toISOString() };
      db[collectionName].push(newRecord);
      saveLocalDB(db);
      return newRecord;
    },
    findByIdAndUpdate: async (id, updateData) => {
      const db = loadLocalDB();
      const items = db[collectionName] || [];
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...updateData, updatedAt: new Date().toISOString() };
      saveLocalDB(db);
      return items[index];
    },
    findByIdAndDelete: async (id) => {
      const db = loadLocalDB();
      const items = db[collectionName] || [];
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return false;
      db[collectionName].splice(index, 1);
      saveLocalDB(db);
      return true;
    },
    deleteMany: async (query = {}) => {
      const db = loadLocalDB();
      const items = db[collectionName] || [];
      db[collectionName] = items.filter(item => !matchQuery(item, query));
      saveLocalDB(db);
      return { deletedCount: items.length - db[collectionName].length };
    },
    countDocuments: async (query = {}) => {
      const db = loadLocalDB();
      const items = db[collectionName] || [];
      return items.filter(item => matchQuery(item, query)).length;
    }
  };
};

// ----------------------------------------------------
// Mongoose / MongoDB Implementation
// ----------------------------------------------------
let MongooseModels = {};

const initMongoose = () => {
  const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['owner', 'admin', 'manager', 'operator', 'customer'], default: 'owner' },
    companyId: { type: String, required: true }
  }, { timestamps: true });

  const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    settings: {
      aiName: { type: String, default: 'Aiva' },
      companyIntroduction: { type: String, default: '' },
      tone: { type: String, enum: ['professional', 'friendly', 'casual'], default: 'friendly' },
      workingHours: { type: String, default: '09:00 - 18:00' },
      languages: { type: [String], default: ['en'] }
    }
  }, { timestamps: true });

  const AISettingsSchema = new mongoose.Schema({
    companyId: { type: String, required: true, unique: true },
    aiName: { type: String, default: 'Aiva' },
    brandVoice: { type: String, default: '' },
    greetingStyle: { type: String, default: 'natural' },
    formality: { type: String, enum: ['formal', 'informal'], default: 'informal' },
    emojiUsage: { type: Boolean, default: true },
    tone: { type: String, enum: ['professional', 'friendly', 'casual'], default: 'friendly' },
    workingHours: { type: String, default: '09:00 - 18:00' },
    languages: { type: [String], default: ['en', 'uz', 'ru'] },
    shippingPolicy: { type: String, default: '' },
    paymentMethods: { type: String, default: '' },
    returnPolicy: { type: String, default: '' },
    responseLength: { type: String, enum: ['short', 'medium', 'long'], default: 'short' },
    creativity: { type: Number, default: 0.7 },
    salesStyle: { type: String, default: 'consultative' },
    provider: { type: String, enum: ['openai', 'gemini', 'claude', 'deepseek', 'ollama'], default: 'openai' },
    model: { type: String, default: 'gpt-3.5-turbo' },
    openaiApiKey: { type: String, default: '' },
    geminiApiKey: { type: String, default: '' },
    claudeApiKey: { type: String, default: '' }
  }, { timestamps: true });

  const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    image: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    features: { type: [String], default: [] },
    specifications: { type: [String], default: [] },
    faqs: [{ question: String, answer: String }],
    companyId: { type: String, required: true }
  }, { timestamps: true });

  const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    companyId: { type: String, required: true }
  }, { timestamps: true });

  const KnowledgeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['document', 'faq', 'policy', 'shipping', 'returns', 'verified_answer'], default: 'faq' },
    companyId: { type: String, required: true },
    question: { type: String, default: '' },
    normalizedQuestion: { type: String, default: '' },
    embedding: { type: [Number], default: [] },
    keywords: { type: [String], default: [] },
    category: { type: String, default: 'General' },
    tags: { type: [String], default: [] },
    language: { type: String, default: 'en' },
    confidence: { type: Number, default: 100 },
    source: { type: String, default: 'faq' },
    lastUsed: { type: Date, default: Date.now },
    usageCount: { type: Number, default: 1 },
    feedbackHelpful: { type: Number, default: 0 },
    feedbackNotHelpful: { type: Number, default: 0 },
    approvalStatus: { type: String, enum: ['pending', 'verified', 'approved', 'rejected'], default: 'verified' }
  }, { timestamps: true });

  const KnowledgeFeedbackSchema = new mongoose.Schema({
    knowledgeId: { type: String, required: true },
    feedbackType: { type: String, enum: ['helpful', 'notHelpful'], required: true },
    userId: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
  }, { timestamps: true });

  const KnowledgeHistorySchema = new mongoose.Schema({
    knowledgeId: { type: String, required: true },
    action: { type: String, enum: ['edit', 'merge', 'delete', 'create'], required: true },
    previousContent: { type: String, default: '' },
    updatedContent: { type: String, default: '' },
    editedBy: { type: String, default: 'admin' },
    timestamp: { type: Date, default: Date.now }
  }, { timestamps: true });

  const KnowledgeVersionSchema = new mongoose.Schema({
    knowledgeId: { type: String, required: true },
    version: { type: Number, default: 1 },
    content: { type: String, required: true },
    approvedBy: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
  }, { timestamps: true });

  const IntegrationSchema = new mongoose.Schema({
    type: { type: String, enum: ['telegram', 'instagram'], required: true },
    status: { type: String, enum: ['connected', 'disconnected'], default: 'disconnected' },
    config: { type: Map, of: String, default: {} },
    companyId: { type: String, required: true }
  }, { timestamps: true });

  const ConversationSchema = new mongoose.Schema({
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerInstagram: { type: String, default: '' },
    customerTelegram: { type: String, default: '' },
    messages: [{
      sender: { type: String, enum: ['customer', 'ai', 'human'], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }],
    companyId: { type: String, required: true },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    channel: { type: String, enum: ['sandbox', 'telegram', 'instagram'], default: 'sandbox' },
    assignedTo: { type: String, enum: ['ai', 'human'], default: 'ai' },
    salesStage: { type: String, default: 'situation' },
    leadScore: { type: Number, default: 0 },
    spinAnswers: {
      situation: { type: String, default: '' },
      problem: { type: String, default: '' },
      implication: { type: String, default: '' },
      needPayoff: { type: String, default: '' }
    },
    qualification: {
      companySize: { type: String, default: '' },
      industry: { type: String, default: '' },
      urgency: { type: String, default: '' },
      budget: { type: Number, default: 0 },
      decisionMaker: { type: String, default: '' },
      businessGoals: { type: String, default: '' },
      painLevel: { type: String, default: '' },
      purchaseIntent: { type: String, default: '' },
      timeline: { type: String, default: '' }
    },
    painPoints: { type: [String], default: [] },
    recommendedProducts: { type: [String], default: [] },
    closeProbability: { type: Number, default: 0 },
    nextFollowUpDate: { type: Date },
    sentimentTimeline: [{
      sentiment: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    intentTimeline: [{
      intent: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    buyingSignals: { type: [String], default: [] },
    objectionsLog: [{
      category: { type: String },
      text: { type: String },
      resolved: { type: Boolean, default: false },
      timestamp: { type: Date, default: Date.now }
    }],
    nextBestAction: { type: String, default: 'ask_discovery' },
    personalityStyle: { type: String, default: '' },
    trustLevel: { type: String, default: 'medium' },
    salesReadiness: { type: Number, default: 0 },
    alphabetPreferred: { type: String, default: 'latin' },
    revenuePrediction: { type: Number, default: 0 },
    customerLifetimeValueEstimate: { type: Number, default: 0 },
    acceptedUpsells: { type: [String], default: [] },
    acceptedCrossSells: { type: [String], default: [] },
    // Permanent Memory Engine Fields
    productsViewed: { type: [String], default: [] },
    productsPurchased: { type: [String], default: [] },
    language: { type: String, default: '' },
    personality: { type: String, default: '' },
    familyInfo: { type: String, default: '' },
    lastConversationSummary: { type: String, default: '' },
    followUpHistory: [{
      note: { type: String },
      timestamp: { type: Date, default: Date.now }
    }]
  }, { timestamps: true });

  const LeadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    telegram: { type: String, default: '' },
    instagram: { type: String, default: '' },
    companyId: { type: String, required: true },
    interestedProduct: { type: String, default: '' },
    conversationHistoryId: { type: String, default: '' },
    budget: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['new', 'contacted', 'negotiation', 'sold', 'lost'], default: 'new' },
    revenue: { type: Number, default: 0 },
    leadScore: { type: Number, default: 0 },
    salesStage: { type: String, default: 'situation' },
    painPoints: { type: [String], default: [] },
    closeProbability: { type: Number, default: 0 },
    sentimentTimeline: [{
      sentiment: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    intentTimeline: [{
      intent: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    buyingSignals: { type: [String], default: [] },
    nextBestAction: { type: String, default: 'ask_discovery' },
    personalityStyle: { type: String, default: '' },
    trustLevel: { type: String, default: 'medium' },
    salesReadiness: { type: Number, default: 0 },
    alphabetPreferred: { type: String, default: 'latin' },
    revenuePrediction: { type: Number, default: 0 },
    customerLifetimeValueEstimate: { type: Number, default: 0 },
    acceptedUpsells: { type: [String], default: [] },
    acceptedCrossSells: { type: [String], default: [] },
    // Permanent Memory Engine Fields
    productsViewed: { type: [String], default: [] },
    productsPurchased: { type: [String], default: [] },
    language: { type: String, default: '' },
    personality: { type: String, default: '' },
    familyInfo: { type: String, default: '' },
    lastConversationSummary: { type: String, default: '' },
    followUpHistory: [{
      note: { type: String },
      timestamp: { type: Date, default: Date.now }
    }]
  }, { timestamps: true });

  const NotificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    companyId: { type: String, required: true }
  }, { timestamps: true });

  // Normalize _id to id in JSON representations
  const transform = (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  };
  [
    UserSchema, CompanySchema, AISettingsSchema, ProductSchema, 
    CategorySchema, KnowledgeSchema, IntegrationSchema, 
    ConversationSchema, LeadSchema, NotificationSchema,
    KnowledgeFeedbackSchema, KnowledgeHistorySchema, KnowledgeVersionSchema
  ].forEach(schema => {
    schema.set('toJSON', { transform });
    schema.set('toObject', { transform });
  });

  MongooseModels.User = mongoose.model('User', UserSchema);
  MongooseModels.Company = mongoose.model('Company', CompanySchema);
  MongooseModels.AISettings = mongoose.model('AISettings', AISettingsSchema);
  MongooseModels.Product = mongoose.model('Product', ProductSchema);
  MongooseModels.Category = mongoose.model('Category', CategorySchema);
  MongooseModels.Knowledge = mongoose.model('Knowledge', KnowledgeSchema);
  MongooseModels.Integration = mongoose.model('Integration', IntegrationSchema);
  MongooseModels.Conversation = mongoose.model('Conversation', ConversationSchema);
  MongooseModels.Lead = mongoose.model('Lead', LeadSchema);
  MongooseModels.Notification = mongoose.model('Notification', NotificationSchema);
  MongooseModels.KnowledgeFeedback = mongoose.model('KnowledgeFeedback', KnowledgeFeedbackSchema);
  MongooseModels.KnowledgeHistory = mongoose.model('KnowledgeHistory', KnowledgeHistorySchema);
  MongooseModels.KnowledgeVersion = mongoose.model('KnowledgeVersion', KnowledgeVersionSchema);
};

// Wrapper around Mongoose models to match the JSON DB interface
const mongooseCollection = (modelName) => {
  return {
    find: async (query = {}) => {
      const docs = await MongooseModels[modelName].find(query);
      return docs.map(d => d.toJSON());
    },
    findOne: async (query = {}) => {
      const doc = await MongooseModels[modelName].findOne(query);
      return doc ? doc.toJSON() : null;
    },
    findById: async (id) => {
      const doc = await MongooseModels[modelName].findById(id);
      return doc ? doc.toJSON() : null;
    },
    create: async (data) => {
      const doc = await MongooseModels[modelName].create(data);
      return doc.toJSON();
    },
    findByIdAndUpdate: async (id, updateData) => {
      const doc = await MongooseModels[modelName].findByIdAndUpdate(id, updateData, { new: true });
      return doc ? doc.toJSON() : null;
    },
    findByIdAndDelete: async (id) => {
      const res = await MongooseModels[modelName].findByIdAndDelete(id);
      return !!res;
    },
    deleteMany: async (query = {}) => {
      return await MongooseModels[modelName].deleteMany(query);
    },
    countDocuments: async (query = {}) => {
      return await MongooseModels[modelName].countDocuments(query);
    }
  };
};

// ----------------------------------------------------
// Database Selector Configuration
// ----------------------------------------------------
const db = {};

const connectDB = async () => {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB Connected Successfully.');
      initMongoose();
      db.users = mongooseCollection('User');
      db.companies = mongooseCollection('Company');
      db.ai_settings = mongooseCollection('AISettings');
      db.products = mongooseCollection('Product');
      db.categories = mongooseCollection('Category');
      db.knowledge = mongooseCollection('Knowledge');
      db.integrations = mongooseCollection('Integration');
      db.conversations = mongooseCollection('Conversation');
      db.leads = mongooseCollection('Lead');
      db.notifications = mongooseCollection('Notification');
      db.knowledge_feedback = mongooseCollection('KnowledgeFeedback');
      db.knowledge_history = mongooseCollection('KnowledgeHistory');
      db.knowledge_versions = mongooseCollection('KnowledgeVersion');
      return;
    } catch (err) {
      console.error('MongoDB connection error, falling back to local JSON file:', err.message);
    }
  } else {
    console.log('No MONGODB_URI found. Utilizing local JSON Database.');
  }

  // Set up fallback local collection references
  useLocalDB = true;
  db.users = localCollection('users');
  db.companies = localCollection('companies');
  db.ai_settings = localCollection('ai_settings');
  db.products = localCollection('products');
  db.categories = localCollection('categories');
  db.knowledge = localCollection('knowledge');
  db.integrations = localCollection('integrations');
  db.conversations = localCollection('conversations');
  db.leads = localCollection('leads');
  db.notifications = localCollection('notifications');
  db.knowledge_feedback = localCollection('knowledge_feedback');
  db.knowledge_history = localCollection('knowledge_history');
  db.knowledge_versions = localCollection('knowledge_versions');
};

module.exports = {
  connectDB,
  getDB: () => db,
  isLocal: () => useLocalDB
};
