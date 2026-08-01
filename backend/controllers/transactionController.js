const Transaction = require('../models/Transaction');

// @desc    Get all transactions for the logged-in user
// @route   GET /api/transactions
const getTransactions = async (req, res) => {
  try {
    // Find transactions where the 'user' field matches the logged-in user's ID
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a new transaction (income/expense)
// @route   POST /api/transactions
const addTransaction = async (req, res) => {
  try {
    const { text, amount, type, category } = req.body;

    const transaction = await Transaction.create({
      user: req.user.id, // Comes from the authMiddleware
      text,
      amount,
      type,
      category
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    // 1. Check if the transaction exists
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // 2. Make sure the logged-in user matches the transaction owner
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this' });
    }

    // 3. Delete it
    await transaction.deleteOne();
    
    res.status(200).json({ id: req.params.id, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Make sure the logged in user matches the transaction user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Update the record
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } 
    );

    res.status(200).json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// NEW: @desc    Delete ALL transactions for the user (Reset Account)
// @route   DELETE /api/transactions/all
const deleteAllTransactions = async (req, res) => {
  try {
    await Transaction.deleteMany({ user: req.user.id });
    res.status(200).json({ message: 'All transactions reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error while resetting account.', error: error.message });
  }
};

// Export all controller functions (Removed the duplicate export)
module.exports = { 
  getTransactions, 
  addTransaction, 
  deleteTransaction, 
  updateTransaction, 
  deleteAllTransactions 
};