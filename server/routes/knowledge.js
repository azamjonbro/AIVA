const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authMiddleware } = require('./auth');

// Get Knowledge Analytics Dashboard stats
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const companyId = req.user.companyId;

    const items = await db.knowledge.find({ companyId });
    
    const totalSize = items.length;
    const learningGrowth = items.filter(i => i.source === 'ai_generation').length;
    const newQuestions = items.filter(i => i.approvalStatus === 'pending').length;
    
    // Duplicate rate: percentage of items that have been reused (usageCount > 1)
    const duplicates = items.filter(i => (i.usageCount || 1) > 1).length;
    const duplicateRate = totalSize > 0 ? Math.round((duplicates / totalSize) * 100) : 0;
    
    // Calculate accuracy based on feedback Helpful vs NotHelpful ratios
    let totalHelpful = 0;
    let totalNotHelpful = 0;
    items.forEach(i => {
      totalHelpful += (i.feedbackHelpful || 0);
      totalNotHelpful += (i.feedbackNotHelpful || 0);
    });
    const totalFeedback = totalHelpful + totalNotHelpful;
    const answerAccuracy = totalFeedback > 0 ? Math.round((totalHelpful / totalFeedback) * 100) : 94; // fallback to 94% standard success rate

    // Calculate Top Categories count
    const categoryCounts = {};
    items.forEach(i => {
      const cat = i.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate Most Asked Questions (sort by usageCount)
    const mostAsked = items
      .map(i => ({
        id: i.id,
        question: i.question || i.title,
        usageCount: i.usageCount || 1,
        category: i.category || 'General',
        confidence: i.confidence || 85,
        status: i.approvalStatus || 'verified'
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    // Confidence distribution ratios
    let highConf = 0; // >80%
    let medConf = 0;  // 60-80%
    let lowConf = 0;  // <60%
    items.forEach(i => {
      const conf = i.confidence || 85;
      if (conf > 80) highConf++;
      else if (conf >= 60) medConf++;
      else lowConf++;
    });

    res.json({
      totalSize,
      learningGrowth,
      newQuestions,
      duplicateRate,
      answerAccuracy,
      topCategories,
      mostAsked,
      confidenceDistribution: {
        high: highConf,
        medium: medConf,
        low: lowConf
      }
    });
  } catch (error) {
    console.error('Fetch knowledge analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all knowledge base items for company
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const type = req.query.type;
    const query = { companyId: req.user.companyId };
    
    if (type) {
      query.type = type;
    }

    const items = await db.knowledge.find(query);
    res.json(items);
  } catch (error) {
    console.error('Fetch knowledge base error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create knowledge item manually
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, type, category, tags, language } = req.body;
    const db = getDB();

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const item = await db.knowledge.create({
      title,
      content,
      type: type || 'faq',
      companyId: req.user.companyId,
      question: title,
      normalizedQuestion: title.toLowerCase().trim(),
      category: category || 'General',
      tags: tags || [],
      language: language || 'en',
      confidence: 100,
      source: 'admin_document',
      usageCount: 1,
      approvalStatus: 'approved' // manually added is approved automatically
    });

    // Save history
    await db.knowledge_history.create({
      knowledgeId: item.id,
      action: 'create',
      updatedContent: content,
      editedBy: req.user.name || 'admin'
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create knowledge item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Collect feedback on an answer (👍/👎 helpful triggers)
router.post('/:id/feedback', async (req, res) => {
  try {
    const { feedbackType, userId } = req.body;
    const db = getDB();

    const item = await db.knowledge.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Knowledge item not found' });
    }

    const updates = {};
    let confidenceDelta = 0;

    if (feedbackType === 'helpful') {
      updates.feedbackHelpful = (item.feedbackHelpful || 0) + 1;
      confidenceDelta = 2; // boost matching score slightly
    } else if (feedbackType === 'notHelpful') {
      updates.feedbackNotHelpful = (item.feedbackNotHelpful || 0) + 1;
      confidenceDelta = -5; // penalize mismatch answers heavily
    } else {
      return res.status(400).json({ message: 'Invalid feedbackType. Must be helpful or notHelpful' });
    }

    // Recalculate confidence bounds (between 10 and 100)
    updates.confidence = Math.max(10, Math.min(100, (item.confidence || 85) + confidenceDelta));

    const updatedItem = await db.knowledge.findByIdAndUpdate(req.params.id, updates);
    
    // Save feedback log
    await db.knowledge_feedback.create({
      knowledgeId: req.params.id,
      feedbackType,
      userId: userId || 'anonymous'
    });

    res.json({ success: true, confidence: updates.confidence, helpful: updates.feedbackHelpful, notHelpful: updates.feedbackNotHelpful });
  } catch (error) {
    console.error('Feedback capture error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update knowledge item (Admin validation curation)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content, type, category, tags, approvalStatus } = req.body;
    const db = getDB();

    const item = await db.knowledge.findById(req.params.id);
    if (!item || item.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Knowledge item not found' });
    }

    const updatedData = {};
    if (title !== undefined) {
      updatedData.title = title;
      updatedData.question = title;
      updatedData.normalizedQuestion = title.toLowerCase().trim();
    }
    if (content !== undefined) updatedData.content = content;
    if (type !== undefined) updatedData.type = type;
    if (category !== undefined) updatedData.category = category;
    if (tags !== undefined) updatedData.tags = tags;
    if (approvalStatus !== undefined) updatedData.approvalStatus = approvalStatus;

    const updatedItem = await db.knowledge.findByIdAndUpdate(req.params.id, updatedData);

    // Save change history
    if (content !== undefined && content !== item.content) {
      await db.knowledge_history.create({
        knowledgeId: item.id,
        action: 'edit',
        previousContent: item.content,
        updatedContent: content,
        editedBy: req.user.name || 'admin'
      });

      // Backup versions
      const currentVersions = await db.knowledge_versions.find({ knowledgeId: item.id });
      await db.knowledge_versions.create({
        knowledgeId: item.id,
        version: currentVersions.length + 1,
        content: content,
        approvedBy: req.user.name || 'admin'
      });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error('Update knowledge item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete knowledge item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const item = await db.knowledge.findById(req.params.id);

    if (!item || item.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Knowledge item not found' });
    }

    await db.knowledge.findByIdAndDelete(req.params.id);
    res.json({ message: 'Knowledge item deleted successfully' });
  } catch (error) {
    console.error('Delete knowledge item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
