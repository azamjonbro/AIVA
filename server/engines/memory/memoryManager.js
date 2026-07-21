const { getDB } = require('../../db');

/**
 * Memory Engine Manager
 * Responsible for loading, updating, and formatting permanent customer memory profiles.
 */
class MemoryManager {
  /**
   * Retrieves memory fields for a given customer.
   * @param {string} companyId - Business ID
   * @param {string} channel - 'telegram' | 'instagram' | 'sandbox'
   * @param {string} customerId - Channel customer ID (e.g. chatId, instagram username/id)
   * @returns {Promise<Object|null>} Structured memory profile
   */
  static async getMemory(companyId, channel, customerId) {
    const db = getDB();
    const query = { companyId, channel };

    if (channel === 'telegram') {
      query.customerTelegram = customerId;
    } else if (channel === 'instagram') {
      query.customerInstagram = customerId;
    } else {
      query.customerName = customerId; // sandbox / fallback lookup
    }

    try {
      const conversation = await db.conversations.findOne(query);
      if (!conversation) return null;

      // Extract permanent memory fields with safe fallbacks
      return {
        id: conversation.id,
        customerName: conversation.customerName || '',
        customerPhone: conversation.customerPhone || '',
        customerEmail: conversation.customerEmail || '',
        customerTelegram: conversation.customerTelegram || '',
        customerInstagram: conversation.customerInstagram || '',
        productsViewed: conversation.productsViewed || [],
        productsPurchased: conversation.productsPurchased || [],
        language: conversation.language || '',
        personality: conversation.personality || '',
        personalityStyle: conversation.personalityStyle || '',
        objections: conversation.objectionsLog || [],
        budget: conversation.qualification?.budget || conversation.budget || 0,
        familyInfo: conversation.familyInfo || '',
        lastConversationSummary: conversation.lastConversationSummary || '',
        followUpHistory: conversation.followUpHistory || [],
        buyingSignals: conversation.buyingSignals || [],
        salesStage: conversation.salesStage || 'situation',
        leadScore: conversation.leadScore || 10,
        closeProbability: conversation.closeProbability || 10,
        trustLevel: conversation.trustLevel || 'medium',
        salesReadiness: conversation.salesReadiness || 10,
        alphabetPreferred: conversation.alphabetPreferred || 'latin'
      };
    } catch (error) {
      console.error('[MemoryManager getMemory Error]:', error.message);
      return null;
    }
  }

  /**
   * Updates permanent memory fields.
   * @param {string} companyId - Business ID
   * @param {string} channel - 'telegram' | 'instagram' | 'sandbox'
   * @param {string} customerId - Channel customer ID
   * @param {Object} updates - Key-value pair of fields to update
   */
  static async updateMemory(companyId, channel, customerId, updates = {}) {
    const db = getDB();
    const query = { companyId, channel };

    if (channel === 'telegram') {
      query.customerTelegram = customerId;
    } else if (channel === 'instagram') {
      query.customerInstagram = customerId;
    } else {
      query.customerName = customerId;
    }

    try {
      let conversation = await db.conversations.findOne(query);
      if (!conversation) {
        // Create new conversation if not found (seed with memory fields)
        const initData = {
          companyId,
          channel,
          status: 'active',
          assignedTo: 'ai',
          messages: [],
          customerName: updates.customerName || 'Visitor',
          customerPhone: updates.customerPhone || '',
          customerEmail: updates.customerEmail || '',
          productsViewed: updates.productsViewed || [],
          productsPurchased: updates.productsPurchased || [],
          language: updates.language || '',
          personality: updates.personality || '',
          familyInfo: updates.familyInfo || '',
          lastConversationSummary: updates.lastConversationSummary || '',
          followUpHistory: updates.followUpHistory || [],
          objectionsLog: updates.objections || []
        };
        if (channel === 'telegram') initData.customerTelegram = customerId;
        else if (channel === 'instagram') initData.customerInstagram = customerId;

        conversation = await db.conversations.create(initData);
      }

      // Compile fields to update
      const updateFields = {};
      
      if (updates.customerName !== undefined) updateFields.customerName = updates.customerName;
      if (updates.customerPhone !== undefined) updateFields.customerPhone = updates.customerPhone;
      if (updates.customerEmail !== undefined) updateFields.customerEmail = updates.customerEmail;
      
      // Append array values with deduplication
      if (Array.isArray(updates.productsViewed)) {
        updateFields.productsViewed = Array.from(new Set([
          ...(conversation.productsViewed || []),
          ...updates.productsViewed
        ]));
      }
      if (Array.isArray(updates.productsPurchased)) {
        updateFields.productsPurchased = Array.from(new Set([
          ...(conversation.productsPurchased || []),
          ...updates.productsPurchased
        ]));
      }
      if (Array.isArray(updates.buyingSignals)) {
        updateFields.buyingSignals = Array.from(new Set([
          ...(conversation.buyingSignals || []),
          ...updates.buyingSignals
        ]));
      }

      if (updates.language !== undefined) updateFields.language = updates.language;
      if (updates.personality !== undefined) updateFields.personality = updates.personality;
      if (updates.personalityStyle !== undefined) updateFields.personalityStyle = updates.personalityStyle;
      if (updates.familyInfo !== undefined) updateFields.familyInfo = updates.familyInfo;
      if (updates.lastConversationSummary !== undefined) updateFields.lastConversationSummary = updates.lastConversationSummary;

      // Handle objections appending
      if (updates.objection && typeof updates.objection === 'object') {
        const objLog = conversation.objectionsLog || [];
        objLog.push({
          category: updates.objection.category,
          text: updates.objection.text,
          resolved: !!updates.objection.resolved,
          timestamp: new Date()
        });
        updateFields.objectionsLog = objLog;
      } else if (Array.isArray(updates.objections)) {
        updateFields.objectionsLog = updates.objections;
      }

      // Handle follow-up appending
      if (updates.followUp && typeof updates.followUp === 'object') {
        const followUps = conversation.followUpHistory || [];
        followUps.push({
          note: updates.followUp.note,
          timestamp: updates.followUp.timestamp || new Date()
        });
        updateFields.followUpHistory = followUps;
      } else if (Array.isArray(updates.followUpHistory)) {
        updateFields.followUpHistory = updates.followUpHistory;
      }

      // Sync lead qualifications/score parameters if provided
      if (updates.budget !== undefined) {
        updateFields.budget = updates.budget;
        updateFields['qualification.budget'] = updates.budget;
      }
      if (updates.salesStage !== undefined) updateFields.salesStage = updates.salesStage;
      if (updates.leadScore !== undefined) updateFields.leadScore = updates.leadScore;
      if (updates.closeProbability !== undefined) updateFields.closeProbability = updates.closeProbability;
      if (updates.trustLevel !== undefined) updateFields.trustLevel = updates.trustLevel;
      if (updates.salesReadiness !== undefined) updateFields.salesReadiness = updates.salesReadiness;
      if (updates.alphabetPreferred !== undefined) updateFields.alphabetPreferred = updates.alphabetPreferred;

      // Perform update on conversation
      await db.conversations.findByIdAndUpdate(conversation.id, updateFields);

      // Sync to linked CRM lead if one exists
      const lead = await db.leads.findOne({ companyId, conversationHistoryId: conversation.id });
      if (lead) {
        const leadUpdates = { ...updateFields };
        // Map conversation properties to matching lead properties
        if (updates.customerName !== undefined) leadUpdates.name = updates.customerName;
        if (updates.customerPhone !== undefined) leadUpdates.phone = updates.customerPhone;
        if (updates.customerEmail !== undefined) leadUpdates.email = updates.customerEmail;
        await db.leads.findByIdAndUpdate(lead.id, leadUpdates);
      }

      return true;
    } catch (error) {
      console.error('[MemoryManager updateMemory Error]:', error.message);
      return false;
    }
  }

  /**
   * Compiles memory fields into a natural language text description block
   * suitable for system prompt injection.
   * @param {Object} memory - Load memory profile object
   * @returns {string} Text context
   */
  static compileMemoryContext(memory) {
    if (!memory) return 'No previous customer memory profiles found.';

    const lines = [
      '--- CUSTOMER PERMANENT PROFILE & MEMORY CONTEXT ---',
      `- Name: ${memory.customerName || 'Unknown visitor'}`,
      `- Phone: ${memory.customerPhone || 'Not provided'}`,
      `- Email: ${memory.customerEmail || 'Not provided'}`,
      `- Language/Script Preference: ${memory.language || 'Unknown'} (${memory.alphabetPreferred || 'latin'} script)`
    ];

    if (memory.personality || memory.personalityStyle) {
      lines.push(`- Personality Style: ${memory.personality || memory.personalityStyle}`);
    }

    if (memory.familyInfo) {
      lines.push(`- Personal/Family Info: ${memory.familyInfo}`);
    }

    if (memory.budget) {
      lines.push(`- Budget Limit: $${memory.budget}`);
    }

    if (memory.productsViewed && memory.productsViewed.length > 0) {
      lines.push(`- Viewed Products: ${memory.productsViewed.join(', ')}`);
    }

    if (memory.productsPurchased && memory.productsPurchased.length > 0) {
      lines.push(`- Purchase History: ${memory.productsPurchased.join(', ')}`);
    }

    if (memory.objections && memory.objections.length > 0) {
      const activeObj = memory.objections.filter(o => !o.resolved).map(o => `[${o.category}] "${o.text}"`);
      if (activeObj.length > 0) {
        lines.push(`- Unresolved Customer Objections: ${activeObj.join('; ')}`);
      }
    }

    if (memory.buyingSignals && memory.buyingSignals.length > 0) {
      lines.push(`- Logged Buying Signals: ${memory.buyingSignals.join(', ')}`);
    }

    lines.push(`- Current Sales Pipeline Stage: ${memory.salesStage} (Lead Score: ${memory.leadScore}/100, Close Probability: ${memory.closeProbability}%)`);
    lines.push(`- Interaction Trust Level: ${memory.trustLevel} (Sales Readiness: ${memory.salesReadiness}/100)`);

    if (memory.lastConversationSummary) {
      lines.push(`- Last Conversation Summary: "${memory.lastConversationSummary}"`);
    }

    lines.push('----------------------------------------------------');
    return lines.join('\n');
  }
}

module.exports = MemoryManager;
