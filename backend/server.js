const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Initialize the Express app
const app = express();

// Middleware
app.use(cors()); // Allows your React Native app to communicate with this API
app.use(express.json()); // Allows the server to parse JSON payloads
// A simple route to test if the server is running
app.get('/', (req, res) => {
  res.send('Personal Finance Tracker API is running...');
});
// // This connects the /api/auth path to the routes we just built. This "registers" the routes to a base URL
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/transactions', require('./routes/transactionRoutes'));
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));
  // Start the server
  const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});