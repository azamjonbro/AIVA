const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authMiddleware } = require('./auth');

// Get all notifications for company
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const notifications = await db.notifications.find({ companyId: req.user.companyId });
    // Sort notifications by date descending
    const sorted = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark all as read
router.post('/read', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const companyId = req.user.companyId;
    const notifications = await db.notifications.find({ companyId, read: false });
    
    for (const notif of notifications) {
      await db.notifications.findByIdAndUpdate(notif.id, { read: true });
    }
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark read notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete specific notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const notif = await db.notifications.findById(req.params.id);

    if (!notif || notif.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await db.notifications.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
