const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDB } = require('../db');
const { authMiddleware } = require('./auth');

// Get all employees for the user's company
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const employees = await db.users.find({ companyId: req.user.companyId });
    // Strip passwords before returning
    const safeEmployees = employees.map(emp => {
      const { password, ...safe } = emp;
      return safe;
    });
    res.json(safeEmployees);
  } catch (error) {
    console.error('Fetch employees error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add new employee (manager / operator)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const db = getDB();

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['admin', 'manager', 'operator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role assignment' });
    }

    // Check if email already registered
    const existing = await db.users.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newEmployee = await db.users.create({
      name,
      email,
      password: hashedPassword,
      role,
      companyId: req.user.companyId
    });

    const { password: _, ...safe } = newEmployee;
    res.status(201).json(safe);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update employee details or role
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, role, email } = req.body;
    const db = getDB();

    const employee = await db.users.findById(req.params.id);
    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check owner protection
    if (employee.role === 'owner' && role && role !== 'owner') {
      return res.status(400).json({ message: 'Cannot change role of workspace owner' });
    }

    const updatedFields = {};
    if (name !== undefined) updatedFields.name = name;
    if (email !== undefined) updatedFields.email = email;
    if (role !== undefined && ['admin', 'manager', 'operator'].includes(role)) {
      updatedFields.role = role;
    }

    const updatedEmployee = await db.users.findByIdAndUpdate(req.params.id, updatedFields);
    const { password: _, ...safe } = updatedEmployee;
    res.json(safe);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete employee
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const employee = await db.users.findById(req.params.id);

    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (employee.role === 'owner') {
      return res.status(400).json({ message: 'Cannot delete the workspace owner' });
    }

    await db.users.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
