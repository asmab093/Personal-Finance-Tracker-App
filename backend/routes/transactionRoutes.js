const express = require('express');
const router = express.Router();
const { 
  getTransactions, 
  addTransaction, 
  deleteTransaction, 
  updateTransaction,
  deleteAllTransactions // <-- Imported the new function
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// Apply the 'protect' middleware to both GET and POST requests
router.route('/')
  .get(protect, getTransactions)
  .post(protect, addTransaction);

// CRITICAL: The /all route MUST be placed above the /:id route
router.route('/all')
  .delete(protect, deleteAllTransactions);

router.route('/:id')
  .delete(protect, deleteTransaction)
  .put(protect, updateTransaction);

module.exports = router;