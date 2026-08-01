const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links this transaction to a specific user account
    required: true
  },
  text: {
    type: String,
    required: [true, 'Please add some text describing the transaction']
  },
  amount: {
    type: Number,
    required: [true, 'Please add a positive or negative number']
  },
  type: {
    type: String,
    enum: ['income', 'expense'], // Forces the value to be one of these two
    required: true
  },
  category: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);