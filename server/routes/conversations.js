const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { generateResponse } = require('../services/ai');
const { authMiddleware } = require('./auth');

const JWT_SECRET = process.env.JWT_SECRET || 'aiva-super-secret-key-9988';

// Optional Authentication Middleware for Chat API
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Ignore error and proceed as anonymous
  }
  next();
};

// Get all conversations for company
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const conversations = await db.conversations.find({ companyId: req.user.companyId });
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single conversation
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const conversation = await db.conversations.findById(req.params.id);
    if (!conversation || conversation.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Chat with AI Endpoint (Anonymous/Sandbox Customer)
router.post('/chat', optionalAuthMiddleware, async (req, res) => {
  try {
    const { conversationId, text, companyId: bodyCompanyId, customerName, customerPhone, customerEmail } = req.body;
    const db = getDB();

    // Determine companyId
    let targetCompanyId = req.user ? req.user.companyId : bodyCompanyId;
    if (!targetCompanyId) {
      // Use the first company available or demo if nothing provided
      const companies = await db.companies.find();
      if (companies.length > 0) {
        targetCompanyId = companies[0].id;
      } else {
        return res.status(400).json({ message: 'Company workspace ID is required' });
      }
    }

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Message text is required' });
    }

    // Retrieve Company and Products details
    const company = await db.companies.findById(targetCompanyId);
    if (!company) {
      return res.status(404).json({ message: 'Company workspace not found' });
    }

    const products = await db.products.find({ companyId: targetCompanyId });

    // Retrieve or Create Conversation
    let conversation = null;
    if (conversationId) {
      conversation = await db.conversations.findById(conversationId);
    }

    if (!conversation) {
      conversation = await db.conversations.create({
        customerName: customerName || 'Visitor',
        customerPhone: customerPhone || '',
        customerEmail: customerEmail || '',
        messages: [],
        companyId: targetCompanyId,
        status: 'active'
      });
    }

    // Add customer message
    const messages = conversation.messages || [];
    messages.push({
      sender: 'customer',
      text: text,
      timestamp: new Date().toISOString()
    });

    // Generate AI response
    const aiResult = await generateResponse(messages, company, products, conversation);

    // Add AI message
    messages.push({
      sender: 'ai',
      text: aiResult.reply,
      timestamp: new Date().toISOString()
    });

    const updateFields = { messages };

    // Apply Sales Framework updates
    if (aiResult.salesStateUpdates) {
      const updates = aiResult.salesStateUpdates;
      updateFields.salesStage = updates.salesStage;
      updateFields.leadScore = updates.leadScore;
      updateFields.spinAnswers = updates.spinAnswers;
      updateFields.qualification = updates.qualification;
      updateFields.painPoints = updates.painPoints;
      updateFields.recommendedProducts = updates.recommendedProducts;
      updateFields.closeProbability = updates.closeProbability;
    }

    // Apply Premium Behavioral updates
    if (aiResult.behavioralIntelligence) {
      const bIntel = aiResult.behavioralIntelligence;
      
      const sentiments = conversation.sentimentTimeline || [];
      if (bIntel.sentiment) {
        sentiments.push({ sentiment: bIntel.sentiment, timestamp: new Date() });
      }
      updateFields.sentimentTimeline = sentiments;

      const intents = conversation.intentTimeline || [];
      if (bIntel.intent && Array.isArray(bIntel.intent)) {
        bIntel.intent.forEach(intentVal => {
          intents.push({ intent: intentVal, timestamp: new Date() });
        });
      } else if (bIntel.intent) {
        intents.push({ intent: bIntel.intent, timestamp: new Date() });
      }
      updateFields.intentTimeline = intents;

      updateFields.buyingSignals = bIntel.buyingSignals || conversation.buyingSignals || [];
      updateFields.nextBestAction = bIntel.nextBestAction || conversation.nextBestAction || 'ask_discovery';
      updateFields.personalityStyle = bIntel.personalityStyle || conversation.personalityStyle || '';
      updateFields.trustLevel = bIntel.trustLevel || conversation.trustLevel || 'medium';
      updateFields.salesReadiness = bIntel.salesReadiness !== undefined ? bIntel.salesReadiness : (conversation.salesReadiness || 0);
      updateFields.alphabetPreferred = bIntel.alphabetPreferred || conversation.alphabetPreferred || 'latin';
      updateFields.revenuePrediction = bIntel.revenuePrediction || conversation.revenuePrediction || 0;
      updateFields.customerLifetimeValueEstimate = bIntel.customerLifetimeValueEstimate || conversation.customerLifetimeValueEstimate || 0;
      updateFields.acceptedUpsells = bIntel.acceptedUpsells || conversation.acceptedUpsells || [];
      updateFields.acceptedCrossSells = bIntel.acceptedCrossSells || conversation.acceptedCrossSells || [];

      if (bIntel.objection) {
        const objLog = conversation.objectionsLog || [];
        objLog.push({
          category: bIntel.objection.category,
          text: bIntel.objection.text,
          resolved: false,
          timestamp: new Date()
        });
        updateFields.objectionsLog = objLog;
      }
    }

    // Process lead if collected by AI
    let leadCreated = false;
    if (aiResult.leadCollected) {
      const leadInfo = aiResult.leadCollected;
      
      // Update customer details in conversation
      updateFields.customerName = leadInfo.name || conversation.customerName;
      updateFields.customerPhone = leadInfo.phone || conversation.customerPhone;
      updateFields.customerEmail = leadInfo.email || conversation.customerEmail;

      // Check if lead already exists with this phone number for this company
      const existingLead = await db.leads.findOne({ 
        companyId: targetCompanyId, 
        phone: leadInfo.phone 
      });

      const leadData = {
        name: leadInfo.name,
        phone: leadInfo.phone,
        email: leadInfo.email || '',
        companyId: targetCompanyId,
        interestedProduct: leadInfo.product || '',
        conversationHistoryId: conversation.id,
        status: 'new',
        revenue: 0,
        leadScore: aiResult.salesStateUpdates?.leadScore || 0,
        salesStage: aiResult.salesStateUpdates?.salesStage || 'situation',
        painPoints: aiResult.salesStateUpdates?.painPoints || [],
        closeProbability: aiResult.salesStateUpdates?.closeProbability || 0,
        salesReadiness: aiResult.behavioralIntelligence?.salesReadiness || 0,
        trustLevel: aiResult.behavioralIntelligence?.trustLevel || 'medium',
        personalityStyle: aiResult.behavioralIntelligence?.personalityStyle || '',
        nextBestAction: aiResult.behavioralIntelligence?.nextBestAction || 'ask_discovery',
        alphabetPreferred: aiResult.behavioralIntelligence?.alphabetPreferred || 'latin',
        buyingSignals: aiResult.behavioralIntelligence?.buyingSignals || [],
        revenuePrediction: aiResult.behavioralIntelligence?.revenuePrediction || 0,
        customerLifetimeValueEstimate: aiResult.behavioralIntelligence?.customerLifetimeValueEstimate || 0,
        acceptedUpsells: aiResult.behavioralIntelligence?.acceptedUpsells || [],
        acceptedCrossSells: aiResult.behavioralIntelligence?.acceptedCrossSells || []
      };

      if (!existingLead) {
        await db.leads.create(leadData);
        leadCreated = true;
      } else {
        await db.leads.findByIdAndUpdate(existingLead.id, {
          leadScore: leadData.leadScore,
          salesStage: leadData.salesStage,
          painPoints: leadData.painPoints,
          closeProbability: leadData.closeProbability,
          salesReadiness: leadData.salesReadiness,
          trustLevel: leadData.trustLevel,
          personalityStyle: leadData.personalityStyle,
          nextBestAction: leadData.nextBestAction,
          alphabetPreferred: leadData.alphabetPreferred,
          buyingSignals: leadData.buyingSignals,
          revenuePrediction: leadData.revenuePrediction,
          customerLifetimeValueEstimate: leadData.customerLifetimeValueEstimate,
          acceptedUpsells: leadData.acceptedUpsells,
          acceptedCrossSells: leadData.acceptedCrossSells
        });
      }
    } else {
      // Sync sales state updates to any existing lead linked to this conversation ID
      try {
        const linkedLead = await db.leads.findOne({
          companyId: targetCompanyId,
          conversationHistoryId: conversation.id
        });
        if (linkedLead) {
          const updates = {};
          if (aiResult.salesStateUpdates) {
            updates.leadScore = aiResult.salesStateUpdates.leadScore;
            updates.salesStage = aiResult.salesStateUpdates.salesStage;
            updates.painPoints = aiResult.salesStateUpdates.painPoints;
            updates.closeProbability = aiResult.salesStateUpdates.closeProbability;
          }
          if (aiResult.behavioralIntelligence) {
            const bIntel = aiResult.behavioralIntelligence;
            updates.salesReadiness = bIntel.salesReadiness;
            updates.trustLevel = bIntel.trustLevel;
            updates.personalityStyle = bIntel.personalityStyle;
            updates.nextBestAction = bIntel.nextBestAction;
            updates.alphabetPreferred = bIntel.alphabetPreferred;
            updates.buyingSignals = bIntel.buyingSignals;
            updates.revenuePrediction = bIntel.revenuePrediction;
            updates.customerLifetimeValueEstimate = bIntel.customerLifetimeValueEstimate;
            updates.acceptedUpsells = bIntel.acceptedUpsells;
            updates.acceptedCrossSells = bIntel.acceptedCrossSells;
          }
          await db.leads.findByIdAndUpdate(linkedLead.id, updates);
        }
      } catch (err) {
        console.error('Error syncing sales stage updates to linked lead:', err);
      }
    }

    // Save conversation updates
    const updatedConversation = await db.conversations.findByIdAndUpdate(conversation.id, updateFields);

    res.json({
      conversation: updatedConversation,
      reply: aiResult.reply,
      leadCreated
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Takeover conversation
router.post('/:id/takeover', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const conv = await db.conversations.findById(req.params.id);
    if (!conv || conv.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const updated = await db.conversations.findByIdAndUpdate(req.params.id, { assignedTo: 'human' });
    res.json({ message: 'Conversation reassigned to human operator', conversation: updated });
  } catch (error) {
    console.error('Takeover error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Hand back to AI
router.post('/:id/handback', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const conv = await db.conversations.findById(req.params.id);
    if (!conv || conv.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const updated = await db.conversations.findByIdAndUpdate(req.params.id, { assignedTo: 'ai' });
    res.json({ message: 'Conversation reassigned back to AI Agent', conversation: updated });
  } catch (error) {
    console.error('Handback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Human operator manual message reply
router.post('/:id/message', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const db = getDB();
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const conv = await db.conversations.findById(req.params.id);
    if (!conv || conv.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = conv.messages || [];
    messages.push({
      sender: 'human',
      text,
      timestamp: new Date().toISOString()
    });

    const updated = await db.conversations.findByIdAndUpdate(req.params.id, { messages });

    // Self-Learning feedback loop: learn from human operator replies
    try {
      const customerMessages = (conv.messages || []).filter(m => m.sender === 'customer');
      if (customerMessages.length > 0) {
        const lastCustomerMsg = customerMessages[customerMessages.length - 1].text;
        const { autoGrowKnowledge } = require('../services/knowledgeEngine');
        await autoGrowKnowledge(db, conv.companyId, lastCustomerMsg, text, 'verified', 'human_operator');
        console.log(`[Self-Learning] Successfully learned Q&A from human operator reply.`);
      }
    } catch (err) {
      console.error('[Self-Learning Failed]:', err.message);
    }

    // If channel is Telegram, send message to customer's Telegram chat
    if (conv.channel === 'telegram' && conv.customerTelegram) {
      try {
        const { sendMessage } = require('../services/telegram');
        const integration = await db.integrations.findOne({ companyId: req.user.companyId, type: 'telegram' });
        const token = integration?.config?.get('token') || integration?.config?.token;
        if (token) {
          await sendMessage(token, conv.customerTelegram, text);
        }
      } catch (err) {
        console.error('Failed to send manual Telegram message:', err.message);
      }
    }

    res.json({ conversation: updated });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
