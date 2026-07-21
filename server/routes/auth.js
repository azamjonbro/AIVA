const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'aiva-super-secret-key-9988';

// Authentication Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Register Owner & Workspace
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, companyName, category } = req.body;
    const db = getDB();

    if (!name || !email || !password || !companyName || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await db.users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create Company/Workspace
    const company = await db.companies.create({
      name: companyName,
      category: category,
      settings: {
        aiName: 'Aiva',
        companyIntroduction: `Welcome to ${companyName}! We specialize in quality ${category} solutions.`,
        tone: 'friendly',
        workingHours: '09:00 - 18:00',
        languages: ['en', 'uz', 'ru']
      }
    });

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await db.users.create({
      name,
      email,
      password: hashedPassword,
      role: 'owner',
      companyId: company.id
    });

    // Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.companyId, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId },
      company
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDB();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await db.users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const company = await db.companies.findById(user.companyId);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.companyId, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId },
      company
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Seed Demo Database Function
const seedDemoData = async (db, companyId) => {
  // Check if we already have products for this company
  const productsCount = await db.products.countDocuments({ companyId });
  if (productsCount > 0) return; // Already seeded

  console.log('Seeding demo data for company:', companyId);

  // 1. Create Demo Products
  const products = [
    {
      name: 'iPhone 15 Pro',
      price: 999,
      description: '128GB, Natural Titanium, A17 Pro chip with 6-core GPU, Pro camera system.',
      category: 'E-commerce',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60',
      stock: 14,
      features: ['A17 Pro Chip', '48MP Camera', 'USB-C', 'Titanium Design'],
      companyId
    },
    {
      name: 'MacBook Air 15 M3',
      price: 1299,
      description: '8GB Unified Memory, 256GB SSD, Liquid Retina display, silent fanless design.',
      category: 'E-commerce',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60',
      stock: 8,
      features: ['Apple M3 Chip', '18hr Battery', 'Liquid Retina Display'],
      companyId
    },
    {
      name: 'iPad Pro 11',
      price: 799,
      description: 'M2 chip, Liquid Retina display, ultra-wide front camera with Center Stage.',
      category: 'E-commerce',
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60',
      stock: 22,
      features: ['M2 Processor', 'ProMotion 120Hz', 'Apple Pencil Hover'],
      companyId
    },
    {
      name: 'AirPods Max',
      price: 549,
      description: 'Over-ear headphones, Active Noise Cancellation, Transparency mode, spatial audio.',
      category: 'E-commerce',
      image: 'https://images.unsplash.com/photo-1548484352-ea579e5233a8?w=500&auto=format&fit=crop&q=60',
      stock: 10,
      features: ['Noise Cancelling', 'Spatial Audio', '20-hour Battery'],
      companyId
    }
  ];

  const createdProducts = [];
  for (const prod of products) {
    const p = await db.products.create(prod);
    createdProducts.push(p);
  }

  // 2. Create Demo Conversations
  const conversations = [
    {
      customerName: 'Anvar Alimov',
      customerPhone: '+998901234567',
      customerEmail: 'anvar@gmail.com',
      messages: [
        { sender: 'customer', text: 'Assalomu alaykum! MacBook Air narxi qancha?', timestamp: new Date(Date.now() - 3600000 * 24 * 3) },
        { sender: 'ai', text: 'Vaalaykum assalom! MacBook Air 15 M3 narxi $1299. U Apple M3 chipi va 18 soatgacha batareya quvvatiga ega. Sotib olishni xohlaysizmi?', timestamp: new Date(Date.now() - 3600000 * 24 * 3 + 60000) },
        { sender: 'customer', text: 'Ha, yetkazib berish bormi? Ismim Anvar, tel: +998901234567', timestamp: new Date(Date.now() - 3600000 * 24 * 3 + 120000) },
        { sender: 'ai', text: 'Ajoyib, Anvar! Toshkent bo‘ylab yetkazib berish bepul. Savdo menedjerimiz tez orada +998901234567 raqamingizga aloqaga chiqadi. Rahmat!', timestamp: new Date(Date.now() - 3600000 * 24 * 3 + 180000) }
      ],
      companyId,
      status: 'active'
    },
    {
      customerName: 'Elena Petrova',
      customerPhone: '+79101234567',
      customerEmail: 'elena.p@yandex.ru',
      messages: [
        { sender: 'customer', text: 'Добрый день! iPhone 15 Pro есть в наличии?', timestamp: new Date(Date.now() - 3600000 * 24 * 2) },
        { sender: 'ai', text: 'Здравствуйте! Да, iPhone 15 Pro в цвете Natural Titanium есть в наличии. Цена $999. Хотите оформить заказ?', timestamp: new Date(Date.now() - 3600000 * 24 * 2 + 60000) },
        { sender: 'customer', text: 'Да, хочу заказать. Позвоните мне: +79101234567. Елена.', timestamp: new Date(Date.now() - 3600000 * 24 * 2 + 120000) },
        { sender: 'ai', text: 'Спасибо, Елена! Менеджер свяжется с вами по номеру +79101234567 для подтверждения заказа на iPhone 15 Pro.', timestamp: new Date(Date.now() - 3600000 * 24 * 2 + 180000) }
      ],
      companyId,
      status: 'active'
    },
    {
      customerName: 'James Smith',
      customerPhone: '+15550199283',
      customerEmail: 'james.smith@hotmail.com',
      messages: [
        { sender: 'customer', text: 'Hi, does the iPad Pro support the Apple Pencil hover feature?', timestamp: new Date(Date.now() - 3600000 * 12) },
        { sender: 'ai', text: 'Hello! Yes, the iPad Pro 11 features the M2 chip which fully supports Apple Pencil Hover. It is priced at $799. Would you like to buy it?', timestamp: new Date(Date.now() - 3600000 * 12 + 60000) }
      ],
      companyId,
      status: 'active'
    }
  ];

  const createdConvs = [];
  for (const conv of conversations) {
    const c = await db.conversations.create(conv);
    createdConvs.push(c);
  }

  // 3. Create Demo Leads
  const leads = [
    {
      name: 'Anvar Alimov',
      phone: '+998901234567',
      email: 'anvar@gmail.com',
      companyId,
      interestedProduct: 'MacBook Air 15 M3',
      conversationHistoryId: createdConvs[0].id,
      status: 'sold',
      revenue: 1299,
      createdAt: new Date(Date.now() - 3600000 * 24 * 3)
    },
    {
      name: 'Elena Petrova',
      phone: '+79101234567',
      email: 'elena.p@yandex.ru',
      companyId,
      interestedProduct: 'iPhone 15 Pro',
      conversationHistoryId: createdConvs[1].id,
      status: 'negotiation',
      revenue: 0,
      createdAt: new Date(Date.now() - 3600000 * 24 * 2)
    },
    {
      name: 'James Smith',
      phone: '+15550199283',
      email: 'james.smith@hotmail.com',
      companyId,
      interestedProduct: 'iPad Pro 11',
      conversationHistoryId: createdConvs[2].id,
      status: 'new',
      revenue: 0,
      createdAt: new Date(Date.now() - 3600000 * 12)
    },
    {
      name: 'Davron Karimov',
      phone: '+998935552211',
      email: 'davron@mail.ru',
      companyId,
      interestedProduct: 'AirPods Max',
      conversationHistoryId: '',
      status: 'sold',
      revenue: 549,
      createdAt: new Date(Date.now() - 3600000 * 24 * 5)
    },
    {
      name: 'Sarah Connor',
      phone: '+13105550199',
      email: 'sarah.c@sky.net',
      companyId,
      interestedProduct: 'iPhone 15 Pro',
      conversationHistoryId: '',
      status: 'lost',
      revenue: 0,
      createdAt: new Date(Date.now() - 3600000 * 24 * 8)
    }
  ];

  for (const lead of leads) {
    await db.leads.create(lead);
  }
};

// Demo Account Autologin
router.post('/demo', async (req, res) => {
  try {
    const db = getDB();
    const demoEmail = 'demo@aiva.com';

    let user = await db.users.findOne({ email: demoEmail });
    let company;

    if (!user) {
      // Create Demo Company
      company = await db.companies.create({
        name: 'Aiva Tech Shop',
        category: 'ecommerce',
        settings: {
          aiName: 'Aiva',
          companyIntroduction: 'We are a premier retailer of Apple products, offering laptops, tablets, and smartphone devices.',
          tone: 'professional',
          workingHours: '09:00 - 20:00',
          languages: ['en', 'uz', 'ru']
        }
      });

      // Create Demo User
      const hashedDemoPassword = await bcrypt.hash('123456', 10);
      user = await db.users.create({
        name: 'SaaS Demo Account',
        email: demoEmail,
        password: hashedDemoPassword,
        role: 'owner',
        companyId: company.id
      });
    } else {
      company = await db.companies.findById(user.companyId);
    }

    // Seed data
    await seedDemoData(db, company.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.companyId, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId },
      company
    });
  } catch (error) {
    console.error('Demo auth error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get profile & workspace details
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const company = await db.companies.findById(user.companyId);
    
    // Find or create AI Settings
    let aiSettings = await db.ai_settings.findOne({ companyId: user.companyId });
    if (!aiSettings) {
      aiSettings = await db.ai_settings.create({
        companyId: user.companyId,
        aiName: company?.settings?.aiName || 'Aiva',
        brandVoice: company?.settings?.companyIntroduction || '',
        tone: company?.settings?.tone || 'friendly',
        workingHours: company?.settings?.workingHours || '09:00 - 18:00',
        languages: company?.settings?.languages || ['en', 'uz', 'ru']
      });
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId },
      company,
      aiSettings: sanitizeAISettings(aiSettings)
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper to mask sensitive keys in API responses
const sanitizeAISettings = (settings) => {
  if (!settings) return null;
  const sanitized = typeof settings.toObject === 'function' ? settings.toObject() : { ...settings };
  
  if (sanitized.geminiApiKey && sanitized.geminiApiKey.length > 8) {
    sanitized.geminiApiKey = sanitized.geminiApiKey.substring(0, 4) + '...' + sanitized.geminiApiKey.substring(sanitized.geminiApiKey.length - 4);
  } else if (sanitized.geminiApiKey) {
    sanitized.geminiApiKey = '••••';
  }
  
  if (sanitized.claudeApiKey && sanitized.claudeApiKey.length > 8) {
    sanitized.claudeApiKey = sanitized.claudeApiKey.substring(0, 4) + '...' + sanitized.claudeApiKey.substring(sanitized.claudeApiKey.length - 4);
  } else if (sanitized.claudeApiKey) {
    sanitized.claudeApiKey = '••••';
  }
  
  if (sanitized.openaiApiKey && sanitized.openaiApiKey.length > 6) {
    sanitized.openaiApiKey = sanitized.openaiApiKey.substring(0, 3) + '...' + sanitized.openaiApiKey.substring(sanitized.openaiApiKey.length - 3);
  } else if (sanitized.openaiApiKey) {
    sanitized.openaiApiKey = '••••';
  }
  return sanitized;
};

// Update AI settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { 
      aiName, companyIntroduction, tone, workingHours, languages,
      brandVoice, greetingStyle, formality, emojiUsage,
      shippingPolicy, paymentMethods, returnPolicy, responseLength, creativity, salesStyle,
      provider, model, openaiApiKey, geminiApiKey, claudeApiKey
    } = req.body;
    
    const db = getDB();
    const companyId = req.user.companyId;

    const company = await db.companies.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company workspace not found' });
    }

    // Update Company settings
    const updatedCompany = await db.companies.findByIdAndUpdate(companyId, {
      settings: {
        aiName: aiName || company.settings?.aiName || 'Aiva',
        companyIntroduction: companyIntroduction !== undefined ? companyIntroduction : (company.settings?.companyIntroduction || ''),
        tone: tone || company.settings?.tone || 'friendly',
        workingHours: workingHours || company.settings?.workingHours || '09:00 - 18:00',
        languages: languages || company.settings?.languages || ['en']
      }
    });

    // Update AI settings record
    let aiSettings = await db.ai_settings.findOne({ companyId });
    const updateData = {
      aiName: aiName || 'Aiva',
      brandVoice: brandVoice !== undefined ? brandVoice : companyIntroduction,
      tone: tone || 'friendly',
      workingHours: workingHours || '09:00 - 18:00',
      languages: languages || ['en'],
      greetingStyle: greetingStyle || 'natural',
      formality: formality || 'informal',
      emojiUsage: emojiUsage !== undefined ? emojiUsage : true,
      shippingPolicy: shippingPolicy || '',
      paymentMethods: paymentMethods || '',
      returnPolicy: returnPolicy || '',
      responseLength: responseLength || 'short',
      creativity: creativity !== undefined ? parseFloat(creativity) : 0.7,
      salesStyle: salesStyle || 'consultative',
      provider: provider || 'openai',
      model: model || 'gpt-3.5-turbo',
      openaiApiKey: openaiApiKey || '',
      geminiApiKey: geminiApiKey || '',
      claudeApiKey: claudeApiKey || ''
    };

    if (aiSettings) {
      // Check if masked keys are sent, if so, retain the old keys from DB
      const existing = await db.ai_settings.findById(aiSettings.id);
      if (existing) {
        if (openaiApiKey === '••••' || (openaiApiKey && openaiApiKey.includes('...'))) {
          updateData.openaiApiKey = existing.openaiApiKey || '';
        }
        if (geminiApiKey === '••••' || (geminiApiKey && geminiApiKey.includes('...'))) {
          updateData.geminiApiKey = existing.geminiApiKey || '';
        }
        if (claudeApiKey === '••••' || (claudeApiKey && claudeApiKey.includes('...'))) {
          updateData.claudeApiKey = existing.claudeApiKey || '';
        }
      }
      aiSettings = await db.ai_settings.findByIdAndUpdate(aiSettings.id, updateData);
    } else {
      aiSettings = await db.ai_settings.create({
        companyId,
        ...updateData
      });
    }

    res.json({ 
      message: 'Settings updated successfully', 
      company: updatedCompany, 
      aiSettings: sanitizeAISettings(aiSettings) 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Test AI Connection
router.post('/settings/test-ai', authMiddleware, async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;
    let testKey = apiKey;

    // Resolve credentials if not sent or if masked
    if (!testKey || testKey === '••••' || testKey.includes('...')) {
      const db = getDB();
      const existingSettings = await db.ai_settings.findOne({ companyId: req.user.companyId });
      if (provider === 'gemini') {
        testKey = existingSettings?.geminiApiKey || process.env.GEMINI_API_KEY;
      } else if (provider === 'claude') {
        testKey = existingSettings?.claudeApiKey || process.env.ANTHROPIC_API_KEY;
      } else if (provider === 'openai') {
        testKey = existingSettings?.openaiApiKey || process.env.OPENAI_API_KEY;
      }
    }

    if (!testKey) {
      return res.status(400).json({ success: false, message: 'API key is not configured for this provider.' });
    }

    let isValid = false;
    let errorMsg = '';

    if (provider === 'gemini') {
      const GeminiProvider = require('../engines/ai/geminiProvider');
      const testProvider = new GeminiProvider(testKey);
      try {
        await testProvider.generateReply([{ sender: 'user', text: 'ping' }], { model: model || 'gemini-1.5-flash' });
        isValid = true;
      } catch (err) {
        errorMsg = err.message;
      }
    } else if (provider === 'claude') {
      const ClaudeProvider = require('../engines/ai/claudeProvider');
      const testProvider = new ClaudeProvider(testKey);
      try {
        await testProvider.generateReply([{ sender: 'user', text: 'ping' }], { model: model || 'claude-3-5-sonnet-20240620', maxTokens: 10 });
        isValid = true;
      } catch (err) {
        errorMsg = err.message;
      }
    } else if (provider === 'openai') {
      const OpenAIProvider = require('../engines/ai/openaiProvider');
      const testProvider = new OpenAIProvider(testKey);
      try {
        await testProvider.generateReply([{ sender: 'user', text: 'ping' }], { model: model || 'gpt-3.5-turbo' });
        isValid = true;
      } catch (err) {
        errorMsg = err.message;
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid AI provider selected.' });
    }

    if (isValid) {
      res.json({ success: true, message: 'Connection successful' });
    } else {
      res.status(400).json({ success: false, message: errorMsg || 'Connection test failed.' });
    }
  } catch (error) {
    console.error('Test AI connection error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during connection test.' });
  }
});

module.exports = {
  router,
  authMiddleware
};
