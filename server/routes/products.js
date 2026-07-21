const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authMiddleware } = require('./auth');

// Get all products for user's company
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const products = await db.products.find({ companyId: req.user.companyId });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single product
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const product = await db.products.findById(req.params.id);
    
    if (!product || product.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, price, description, category, image, stock, features } = req.body;
    const db = getDB();

    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Product name and price are required' });
    }

    const product = await db.products.create({
      name,
      price: parseFloat(price),
      description: description || '',
      category: category || '',
      image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
      stock: stock !== undefined ? parseInt(stock) : 0,
      features: Array.isArray(features) ? features : (features ? features.split(',').map(f => f.trim()) : []),
      companyId: req.user.companyId
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update product
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, price, description, category, image, stock, features } = req.body;
    const db = getDB();

    const product = await db.products.findById(req.params.id);
    if (!product || product.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedData = {};
    if (name !== undefined) updatedData.name = name;
    if (price !== undefined) updatedData.price = parseFloat(price);
    if (description !== undefined) updatedData.description = description;
    if (category !== undefined) updatedData.category = category;
    if (image !== undefined) updatedData.image = image;
    if (stock !== undefined) updatedData.stock = parseInt(stock);
    if (features !== undefined) {
      updatedData.features = Array.isArray(features) ? features : features.split(',').map(f => f.trim());
    }

    const updatedProduct = await db.products.findByIdAndUpdate(req.params.id, updatedData);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const product = await db.products.findById(req.params.id);
    
    if (!product || product.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await db.products.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
