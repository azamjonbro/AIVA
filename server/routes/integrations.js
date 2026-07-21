const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authMiddleware } = require('./auth');
const { startBot, stopBot } = require('../services/telegram');
const { generateResponse } = require('../services/ai');

// Fetch current integrations for company
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const integrations = await db.integrations.find({ companyId: req.user.companyId });
    res.json(integrations);
  } catch (error) {
    console.error('Fetch integrations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Connect/Disconnect Telegram Bot
router.post('/telegram', authMiddleware, async (req, res) => {
  try {
    const { token, status } = req.body;
    const db = getDB();
    const companyId = req.user.companyId;

    let integration = await db.integrations.findOne({ companyId, type: 'telegram' });

    if (status === 'disconnected') {
      stopBot(companyId);
      if (integration) {
        integration = await db.integrations.findByIdAndUpdate(integration.id, {
          status: 'disconnected',
          config: { token: '' }
        });
      }
      return res.json({ message: 'Telegram Bot disconnected', integration });
    }

    if (!token) {
      return res.status(400).json({ message: 'Bot Token is required' });
    }

    // Save token and mark connected
    const configData = { token, botUsername: '@AivaEmployeeBot' };
    if (integration) {
      integration = await db.integrations.findByIdAndUpdate(integration.id, {
        status: 'connected',
        config: configData
      });
    } else {
      integration = await db.integrations.create({
        type: 'telegram',
        status: 'connected',
        config: configData,
        companyId
      });
    }

    // Start long-polling listener process
    startBot(companyId, token);

    res.json({ message: 'Telegram Bot connected successfully', integration });
  } catch (error) {
    console.error('Telegram integration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Connect/Disconnect Instagram Account
router.post('/instagram', authMiddleware, async (req, res) => {
  try {
    const { username, accessToken, status } = req.body;
    const db = getDB();
    const companyId = req.user.companyId;

    let integration = await db.integrations.findOne({ companyId, type: 'instagram' });

    if (status === 'disconnected') {
      if (integration) {
        integration = await db.integrations.findByIdAndUpdate(integration.id, {
          status: 'disconnected',
          config: { username: '', accessToken: '' }
        });
      }
      return res.json({ message: 'Instagram Business account disconnected', integration });
    }

    if (!username || !accessToken) {
      return res.status(400).json({ message: 'Username and Page Access Token are required' });
    }

    const configData = { username, accessToken };
    if (integration) {
      integration = await db.integrations.findByIdAndUpdate(integration.id, {
        status: 'connected',
        config: configData
      });
    } else {
      integration = await db.integrations.create({
        type: 'instagram',
        status: 'connected',
        config: configData,
        companyId
      });
    }

    res.json({ message: 'Instagram Business connected successfully', integration });
  } catch (error) {
    console.error('Instagram integration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Simulate message from Telegram / Instagram
router.post('/simulate', authMiddleware, async (req, res) => {
  try {
    const { channel, senderId, senderName, text } = req.body;
    const db = getDB();
    const companyId = req.user.companyId;

    if (!channel || !senderId || !text) {
      return res.status(400).json({ message: 'Channel, senderId, and text are required' });
    }

    // Find or create conversation
    const query = { companyId, channel };
    if (channel === 'telegram') query.customerTelegram = senderId;
    else query.customerInstagram = senderId;

    let conversation = await db.conversations.findOne(query);

    if (!conversation) {
      const creationData = {
        customerName: senderName || 'Simulation User',
        channel,
        companyId,
        status: 'active',
        assignedTo: 'ai',
        messages: []
      };
      if (channel === 'telegram') creationData.customerTelegram = senderId;
      else creationData.customerInstagram = senderId;

      conversation = await db.conversations.create(creationData);
    }

    // Append customer message
    const messages = conversation.messages || [];
    messages.push({
      sender: 'customer',
      text,
      timestamp: new Date().toISOString()
    });

    // If human operator has taken over, do not auto-respond
    if (conversation.assignedTo === 'human') {
      const updated = await db.conversations.findByIdAndUpdate(conversation.id, { messages });
      return res.json({
        conversation: updated,
        reply: '(Session is currently assigned to a human operator. Auto-reply disabled.)',
        leadCreated: false
      });
    }

    // Generate AI response
    const company = await db.companies.findById(companyId);
    const products = await db.products.find({ companyId });
    const aiResult = await generateResponse(messages, company, products, conversation);

    // Append AI message
    messages.push({
      sender: 'ai',
      text: aiResult.reply,
      timestamp: new Date().toISOString()
    });

    const updateFields = { messages };
    let leadCreated = false;

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

    if (aiResult.transferToHuman) {
      updateFields.assignedTo = 'human';
      const transferMessage = "I am transferring our conversation to a human manager. Please hold on.";
      messages.push({
        sender: 'ai',
        text: transferMessage,
        timestamp: new Date().toISOString()
      });

      // Notification
      await db.notifications.create({
        title: 'Human Takeover Required',
        message: `Simulation user ${senderName} requested human support on ${channel}.`,
        type: 'warning',
        companyId,
        read: false
      });
    }

    if (aiResult.leadCollected) {
      const leadInfo = aiResult.leadCollected;
      updateFields.customerName = leadInfo.name || conversation.customerName;
      updateFields.customerPhone = leadInfo.phone || conversation.customerPhone;
      updateFields.customerEmail = leadInfo.email || conversation.customerEmail;

      const existingLead = await db.leads.findOne({ companyId, phone: leadInfo.phone });
      const leadData = {
        name: leadInfo.name,
        phone: leadInfo.phone,
        email: leadInfo.email || '',
        companyId,
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
        buyingSignals: aiResult.behavioralIntelligence?.buyingSignals || []
      };
      if (channel === 'telegram') leadData.telegram = senderId;
      else leadData.instagram = senderId;

      if (!existingLead) {
        await db.leads.create(leadData);
        leadCreated = true;

        await db.notifications.create({
          title: 'New Lead Captured',
          message: `Simulation user logged as lead interested in ${leadInfo.product || 'products'}.`,
          type: 'success',
          companyId,
          read: false
        });
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
          buyingSignals: leadData.buyingSignals
        });
      }
    } else {
      // Sync sales state updates to any existing lead linked to this conversation ID
      try {
        const linkedLead = await db.leads.findOne({
          companyId,
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
          }
          await db.leads.findByIdAndUpdate(linkedLead.id, updates);
        }
      } catch (err) {
        console.error('Error syncing sales stage updates to linked lead:', err);
      }
    }

    const updated = await db.conversations.findByIdAndUpdate(conversation.id, updateFields);

    res.json({
      conversation: updated,
      reply: aiResult.reply,
      leadCreated,
      transferToHuman: !!aiResult.transferToHuman
    });
  } catch (error) {
    console.error('Simulator error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Backend API Endpoint for processing bot message
router.post('/telegram/message', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const botSecret = process.env.BOT_SECRET || 'aiva_super_secure_bot_secret_2026';
    if (!authHeader || authHeader !== `Bearer ${botSecret}`) {
      console.warn(`[${new Date().toISOString()}] Unauthorized attempt to /telegram/message`);
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { chatId, telegramId, username, firstName, lastName, language, message } = req.body;
    const db = getDB();

    // Resolve company by Bot Token or custom headers
    const botToken = req.headers['x-telegram-bot-token'] || req.body.botToken;
    const headerCompanyId = req.headers['x-company-id'] || req.body.companyId;

    let targetCompanyId = headerCompanyId;
    if (!targetCompanyId && botToken) {
      const integrations = await db.integrations.find({ type: 'telegram' });
      const integration = integrations.find(i => i.config?.token === botToken);
      if (integration) {
        targetCompanyId = integration.companyId;
      }
    }

    if (!targetCompanyId) {
      const fallbackCompany = await db.companies.findOne();
      if (fallbackCompany) {
        targetCompanyId = fallbackCompany.id;
      } else {
        return res.status(400).json({ success: false, message: 'Company workspace not found' });
      }
    }

    // Load Company and Products
    const company = await db.companies.findById(targetCompanyId);
    const products = await db.products.find({ companyId: targetCompanyId });

    // Find or create active conversation using chatId
    let conversation = await db.conversations.findOne({
      companyId: targetCompanyId,
      customerTelegram: chatId,
      channel: 'telegram'
    });

    if (!conversation) {
      conversation = await db.conversations.create({
        customerName: `${firstName} ${lastName}`.trim() || 'Telegram User',
        customerTelegram: chatId,
        messages: [],
        companyId: targetCompanyId,
        channel: 'telegram',
        status: 'active',
        salesStage: 'situation',
        leadScore: 10,
        spinAnswers: { situation: '', problem: '', implication: '', needPayoff: '' },
        qualification: { companySize: '', industry: '', urgency: '', budget: 0, decisionMaker: '', businessGoals: '', painLevel: '', purchaseIntent: '', timeline: '' },
        painPoints: [],
        recommendedProducts: [],
        closeProbability: 10,
        sentimentTimeline: [],
        intentTimeline: [],
        buyingSignals: [],
        nextBestAction: 'ask_discovery',
        personalityStyle: '',
        trustLevel: 'medium',
        salesReadiness: 10,
        alphabetPreferred: 'latin'
      });
    }

    // Add user message
    const messages = conversation.messages || [];
    messages.push({
      sender: 'customer',
      text: message,
      timestamp: new Date().toISOString()
    });

    // Call AIVA AI Response Engine
    const aiResult = await generateResponse(messages, company, products, conversation);

    // Add AI message
    messages.push({
      sender: 'ai',
      text: aiResult.reply,
      timestamp: new Date().toISOString()
    });

    const updateFields = { messages };

    // Apply SPIN updates
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

    // Apply Premium behavior updates
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

    // Handle human handover assignment
    if (aiResult.transferToHuman) {
      updateFields.assignedTo = 'human';
      
      await db.notifications.create({
        title: 'Human Takeover Required',
        message: `Telegram user ${firstName} ${lastName} requested human takeover.`,
        type: 'warning',
        companyId: targetCompanyId,
        read: false
      });
    }

    // Process lead if collected
    if (aiResult.leadCollected) {
      const leadInfo = aiResult.leadCollected;
      updateFields.customerName = leadInfo.name || conversation.customerName;
      updateFields.customerPhone = leadInfo.phone || conversation.customerPhone;
      updateFields.customerEmail = leadInfo.email || conversation.customerEmail;

      const existingLead = await db.leads.findOne({ companyId: targetCompanyId, phone: leadInfo.phone });
      const leadData = {
        name: leadInfo.name,
        phone: leadInfo.phone,
        email: leadInfo.email || '',
        telegram: username || chatId,
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

    await db.conversations.findByIdAndUpdate(conversation.id, updateFields);

    res.json({
      success: true,
      reply: aiResult.reply,
      typingDelay: aiResult.transferToHuman ? 500 : 1500
    });
  } catch (error) {
    console.error('API /telegram/message error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Webhook endpoint receiver (Decoupled Bot Transport Layer)
router.post('/telegram/webhook/:token', async (req, res) => {
  const { token } = req.params;
  const db = getDB();
  
  console.log(`[${new Date().toISOString()}] [Telegram Webhook] Received webhook update for token: ${token.substring(0, 10)}...`);

  // Validate webhook origin (check if token matches connected integration)
  const integrations = await db.integrations.find({ type: 'telegram', status: 'connected' });
  const integration = integrations.find(i => i.config?.token === token);
  if (!integration) {
    console.warn(`[${new Date().toISOString()}] Webhook rejected: Token not registered or disconnected.`);
    return res.status(404).json({ error: 'Integration token not active' });
  }

  const { message, business_message } = req.body;
  const targetMessage = message || business_message;
  
  if (!targetMessage || !targetMessage.text) {
    return res.sendStatus(200);
  }

  const chatId = targetMessage.chat.id.toString();
  const telegramId = targetMessage.from.id.toString();
  const username = targetMessage.from.username || '';
  const firstName = targetMessage.from.first_name || '';
  const lastName = targetMessage.from.last_name || '';
  const language = targetMessage.from.language_code || 'uz';
  const text = targetMessage.text;
  const businessConnectionId = targetMessage.business_connection_id || null;

  const payload = {
    chatId,
    telegramId,
    username,
    firstName,
    lastName,
    language,
    message: text,
    platform: 'telegram',
    businessConnectionId
  };

  // Run the retry handler asynchronously
  const { forwardToBackendWithRetry, sendBotReply } = require('../services/telegramWebhook');
  
  res.sendStatus(200); // Acknowledge webhook receipt to Telegram instantly

  try {
    const aiResponse = await forwardToBackendWithRetry(payload, {
      'X-Telegram-Bot-Token': token,
      'X-Company-ID': integration.companyId
    });

    if (aiResponse && aiResponse.reply) {
      await sendBotReply(token, chatId, aiResponse.reply, aiResponse.typingDelay || 1200, businessConnectionId);
    }
  } catch (error) {
    console.error(`[Telegram Webhook Error] Failed to process incoming update:`, error.message);
    
    // Outward human-like fallback error notification
    const friendlyError = "Uzr, hozir texnik nosozlik yuz berdi. Bir necha daqiqadan so'ng yana urinib ko'ring.";
    try {
      await sendBotReply(token, chatId, friendlyError, 500, businessConnectionId);
    } catch (sendErr) {
      console.error('[Telegram Webhook Error] Failed to send fallback error reply:', sendErr.message);
    }
  }
});

module.exports = router;
