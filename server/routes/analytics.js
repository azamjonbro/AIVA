const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authMiddleware } = require('./auth');

// Helper to format date as short name (e.g., "Jun 20" or "Mon")
const formatDateKey = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const companyId = req.user.companyId;

    // Fetch all records for the company
    const leads = await db.leads.find({ companyId });
    const conversations = await db.conversations.find({ companyId });
    const products = await db.products.find({ companyId });

    // Compute Summary KPIs
    const totalConversations = conversations.length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const convertedCustomers = leads.filter(l => l.status === 'sold').length;
    const revenueGenerated = leads.filter(l => l.status === 'sold').reduce((sum, l) => sum + (l.revenue || 0), 0);

    // AI Sales Qualification and framework calculations
    const totalLeadsCount = leads.length;
    const qualifiedLeadsCount = leads.filter(l => (l.leadScore || 0) >= 50).length;
    const qualificationRate = totalLeadsCount > 0 ? Math.round((qualifiedLeadsCount / totalLeadsCount) * 100) : 70;
    
    const soldLeadsCount = leads.filter(l => l.status === 'sold').length;
    const conversionRate = totalLeadsCount > 0 ? Math.round((soldLeadsCount / totalLeadsCount) * 100) : 25;
    const aov = soldLeadsCount > 0 ? Math.round(revenueGenerated / soldLeadsCount) : 550;

    const upsellPitched = leads.filter(l => (l.leadScore || 0) > 60).length;
    const upsellAccepted = leads.filter(l => l.status === 'sold' && l.revenue > 800).length;
    const upsellAcceptanceRate = upsellPitched > 0 ? Math.round((upsellAccepted / upsellPitched) * 100) : 40;
    const crossSellAcceptanceRate = 35; // Baseline cross-sell percentage (Telegram bot addons, WhatsApp, CRM)

    let totalDays = 0;
    let countSold = 0;
    leads.forEach(l => {
      if (l.status === 'sold' && l.createdAt && l.updatedAt) {
        const diffMs = new Date(l.updatedAt) - new Date(l.createdAt);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        totalDays += Math.max(0.5, diffDays);
        countSold++;
      }
    });
    const avgSalesCycle = countSold > 0 ? Math.round((totalDays / countSold) * 10) / 10 : 2.1;

    // AI Response Rate: Count messages sent by AI vs Customer
    let totalMessages = 0;
    let aiMessages = 0;
    conversations.forEach(c => {
      if (c.messages) {
        totalMessages += c.messages.length;
        aiMessages += c.messages.filter(m => m.sender === 'ai').length;
      }
    });
    const aiResponseRate = totalMessages > 0 ? Math.round((aiMessages / (totalMessages / 2)) * 100) : 100;
    // (Note: totalMessages/2 is approx customer messages, so AI response rate is percentage of customer messages answered)
    const clampedResponseRate = Math.min(aiResponseRate, 100);

    // Generate 7-Day Chart Timeline
    const chartTimeline = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const label = formatDateKey(dateString);
      chartTimeline.push({ dateString, label, revenue: 0, customers: 0, conversations: 0 });
    }

    // Populate timeline data from leads and conversations
    leads.forEach(lead => {
      if (!lead.createdAt) return;
      const leadDate = new Date(lead.createdAt).toISOString().split('T')[0];
      const match = chartTimeline.find(t => t.dateString === leadDate);
      if (match) {
        if (lead.status === 'sold') {
          match.revenue += (lead.revenue || 0);
          match.customers += 1;
        }
      }
    });

    conversations.forEach(c => {
      if (!c.createdAt) return;
      const convDate = new Date(c.createdAt).toISOString().split('T')[0];
      const match = chartTimeline.find(t => t.dateString === convDate);
      if (match) {
        match.conversations += 1;
      }
    });

    // Formatting charts for Recharts
    const salesGrowth = chartTimeline.map(t => ({
      name: t.label,
      Sales: t.revenue
    }));

    const customerGrowth = chartTimeline.map(t => ({
      name: t.label,
      Customers: t.customers
    }));

    const conversationAnalytics = chartTimeline.map(t => ({
      name: t.label,
      Chats: t.conversations
    }));

    // Sales Funnel Chart
    const funnelStatuses = ['new', 'contacted', 'negotiation', 'sold', 'lost'];
    const funnelLabels = {
      new: 'New Leads',
      contacted: 'Contacted',
      negotiation: 'Negotiation',
      sold: 'Converted (Sold)',
      lost: 'Lost'
    };
    
    const salesFunnel = funnelStatuses.map(status => ({
      name: funnelLabels[status],
      value: leads.filter(l => l.status === status).length
    }));

    // Message breakdown
    const humanAnswers = conversations.reduce((sum, c) => sum + (c.messages?.filter(m => m.sender === 'human').length || 0), 0);
    const totalMessagesBreakdown = [
      { name: 'AI Answers', value: aiMessages },
      { name: 'Human Answers', value: humanAnswers },
      { name: 'Customer Messages', value: conversations.reduce((sum, c) => sum + (c.messages?.filter(m => m.sender === 'customer').length || 0), 0) }
    ];

    res.json({
      summary: {
        totalConversations,
        newLeads,
        convertedCustomers,
        revenueGenerated,
        aiResponseRate: clampedResponseRate,
        qualificationRate,
        conversionRate,
        aov,
        upsellAcceptanceRate,
        crossSellAcceptanceRate,
        avgSalesCycle
      },
      charts: {
        salesGrowth,
        customerGrowth,
        conversationAnalytics,
        salesFunnel,
        totalMessagesBreakdown
      }
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
