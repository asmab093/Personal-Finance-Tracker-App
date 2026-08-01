const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  changePassword // <-- Imported the new controller
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // <-- Imported middleware to verify the user

// Define the POST routes and attach them to the controller functions
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// NEW: Protected route to change password from the app's Profile screen
router.put('/change-password', protect, changePassword);

module.exports = router;