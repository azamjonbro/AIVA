const https = require('https');
const { getDB } = require('../db');
const { generateResponse } = require('./ai');

const activePollers = new Map();

// Helper to make HTTPS requests
const request = (url, method, data = null) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve({ ok: false, error: 'Failed to parse response' });
        }
      });
    });

    req.on('error', (e) => {
      console.error('[Telegram API Request Error]:', e.message);
      resolve({ ok: false, error: e.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

// Send Telegram Message
const sendMessage = async (token, chatId, text) => {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  return await request(url, 'POST', { chat_id: chatId, text: text });
};

// Polling Loop for a Bot
const pollBot = async (token, companyId) => {
  let lastUpdateId = 0;
  
  const checkUpdates = async () => {
    if (!activePollers.has(companyId)) return; // Poller stopped
    
    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=5`;
      const res = await request(url, 'GET');
      
      if (res.ok && res.result && res.result.length > 0) {
        for (const update of res.result) {
          lastUpdateId = update.update_id;
          
          if (update.message && update.message.text) {
            const chatId = update.message.chat.id.toString();
            const text = update.message.text;
            const firstName = update.message.chat.first_name || 'Telegram User';
            const lastName = update.message.chat.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const username = update.message.chat.username ? `@${update.message.chat.username}` : '';
            
            await handleIncomingMessage({
              companyId,
              chatId,
              text,
              fullName,
              username,
              token
            });
          }
        }
      }
    } catch (err) {
      console.error(`[Telegram Poller Error] Company ${companyId}:`, err.message);
    }
    
    // Schedule next poll check
    if (activePollers.has(companyId)) {
      const timer = setTimeout(checkUpdates, 2000);
      activePollers.set(companyId, timer);
    }
  };

  checkUpdates();
};

// Process message through AIVA engine
const handleIncomingMessage = async ({ companyId, chatId, text, fullName, username, token }) => {
  const db = getDB();
  
  // 1. Get Conversation
  let conversation = await db.conversations.findOne({ 
    companyId, 
    customerTelegram: chatId,
    channel: 'telegram'
  });
  
  if (!conversation) {
    conversation = await db.conversations.create({
      customerName: fullName,
      customerTelegram: chatId,
      messages: [],
      companyId,
      status: 'active',
      channel: 'telegram',
      assignedTo: 'ai'
    });
  }
  
  // 2. Add customer message to thread
  const messages = conversation.messages || [];
  messages.push({
    sender: 'customer',
    text: text,
    timestamp: new Date().toISOString()
  });
  
  // If assigned to a human, do not generate AI response
  if (conversation.assignedTo === 'human') {
    // Save customer message
    await db.conversations.findByIdAndUpdate(conversation.id, { messages });
    return;
  }
  
  // 3. Load Company Context
  const company = await db.companies.findById(companyId);
  const products = await db.products.find({ companyId });
  
  // 4. Generate AI response
  const aiResult = await generateResponse(messages, company, products, conversation);
  
  // 5. Add AI reply
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
  
  // 6. Handle Handovers and Leads
  if (aiResult.transferToHuman) {
    updateFields.assignedTo = 'human';
    // Send standard transfer message
    const transferMsg = "I will transfer our conversation to a human manager. Please wait a moment.";
    messages.push({
      sender: 'ai',
      text: transferMsg,
      timestamp: new Date().toISOString()
    });
    await sendMessage(token, chatId, transferMsg);
    
    // Log Notification
    await db.notifications.create({
      title: 'Human Takeover Required',
      message: `Customer ${fullName} requested human transfer on Telegram.`,
      type: 'warning',
      companyId,
      read: false
    });
  } else {
    // Send actual response
    await sendMessage(token, chatId, aiResult.reply);
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
      telegram: username || chatId,
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

    if (!existingLead) {
      await db.leads.create(leadData);
      
      await db.notifications.create({
        title: 'New Lead Captured',
        message: `Telegram user ${fullName} logged as interested in ${leadInfo.product || 'products'}.`,
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
  
  await db.conversations.findByIdAndUpdate(conversation.id, updateFields);
};

// Start Webhook Registration for a bot token
const startBot = (companyId, token) => {
  stopBot(companyId);
  console.log(`[Telegram] Activating Webhook Listener for Company: ${companyId}`);
  activePollers.set(companyId, true);
  
  const { registerTelegramWebhook } = require('./telegramWebhook');
  registerTelegramWebhook(token).catch(err => {
    console.error(`[Telegram Webhook Activation Failed] Company: ${companyId}, Error:`, err.message);
  });
};

// Stop Bot Webhook (Deactivate webhook poller metadata)
const stopBot = (companyId) => {
  if (activePollers.has(companyId)) {
    console.log(`[Telegram] Deactivating Webhook Listener for Company: ${companyId}`);
    activePollers.delete(companyId);
  }
};

// Initialize Connected Bots on Boot
const initAllBots = async () => {
  try {
    const db = getDB();
    const integrations = await db.integrations.find({ type: 'telegram', status: 'connected' });
    for (const integration of integrations) {
      const token = (integration.config && typeof integration.config.get === 'function' ? integration.config.get('token') : null) || integration.config?.token;
      if (token) {
        startBot(integration.companyId, token);
      }
    }
  } catch (err) {
    console.error('[Telegram Init Error]:', err.message);
  }
};

module.exports = {
  startBot,
  stopBot,
  initAllBots,
  sendMessage
};
