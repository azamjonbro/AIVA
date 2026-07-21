const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authMiddleware } = require('./auth');

// Get all leads
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const leads = await db.leads.find({ companyId: req.user.companyId });
    res.json(leads);
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create lead manually
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, interestedProduct, status, revenue } = req.body;
    const db = getDB();

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone number are required' });
    }

    const lead = await db.leads.create({
      name,
      phone,
      email: email || '',
      interestedProduct: interestedProduct || '',
      status: status || 'new',
      revenue: revenue !== undefined ? parseFloat(revenue) : 0,
      companyId: req.user.companyId,
      conversationHistoryId: ''
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update lead status
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, revenue, name, phone, email, interestedProduct } = req.body;
    const db = getDB();

    const lead = await db.leads.findById(req.params.id);
    if (!lead || lead.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const updatedData = {};
    if (status !== undefined) {
      updatedData.status = status;
      // If status is updated to sold, ensure we record revenue
      if (status === 'sold') {
        if (revenue !== undefined) {
          updatedData.revenue = parseFloat(revenue);
        } else if (lead.revenue === 0) {
          // Attempt to find product price or assign default
          let price = 500;
          if (lead.interestedProduct) {
            const product = await db.products.findOne({ 
              companyId: req.user.companyId, 
              name: lead.interestedProduct 
            });
            if (product) price = product.price;
          }
          updatedData.revenue = price;
        }
      } else if (status !== 'sold') {
        // Reset revenue if status is no longer sold? Usually no, but we keep it or update
      }
    }
    
    if (revenue !== undefined) updatedData.revenue = parseFloat(revenue);
    if (name !== undefined) updatedData.name = name;
    if (phone !== undefined) updatedData.phone = phone;
    if (email !== undefined) updatedData.email = email;
    if (interestedProduct !== undefined) updatedData.interestedProduct = interestedProduct;

    const updatedLead = await db.leads.findByIdAndUpdate(req.params.id, updatedData);
    res.json(updatedLead);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete lead
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const lead = await db.leads.findById(req.params.id);
    
    if (!lead || lead.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await db.leads.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
