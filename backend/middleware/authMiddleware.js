const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if the request headers have a Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get the token string
      token = req.headers.authorization.split(' ')[1];

      // Verify token against your secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user in the database and attach them to the request (minus their password)
      req.user = await User.findById(decoded.id).select('-password');
      
      next(); // Move on to the actual route
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };