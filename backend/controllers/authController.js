const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// Helper function to generate a JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user in the database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    // Compare the entered password with the hashed password in the DB
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: 'There is no user with that email' });
    }

    // Get the reset token
    const resetToken = user.getResetPasswordToken();

    // Save the token to the database (we pass validateBeforeSave: false to skip password validation)
    await user.save({ validateBeforeSave: false });

    // Create the reset URL (In a real mobile app, this would be a deep link. For now, we will just output the token)
    const resetUrl = `Your password reset token is: \n\n ${resetToken} \n\n Use this token in the Reset Password screen.`;

    try {
    //   await sendEmail({
    //     email: user.email,
    //     subject: 'Password Reset Token',
    //     message: resetUrl,
    //   });

      // Also log it to the console so you can test it immediately without setting up Mailtrap!
      console.log('RESET TOKEN (Use this to reset password):', resetToken);

      res.status(200).json({ message: 'Email sent' });
    } catch (error) {
      // If the email fails to send, clear the token from the database
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
const resetPassword = async (req, res) => {
  try {
    // 1. Reconstruct the hashed token from the raw token sent in the URL
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    // 2. Find the user with this token and ensure it hasn't expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }, // Token must still be in the future
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // 3. Hash the new password using bcrypt (just like we did in register)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // 4. Erase the temporary token fields from the database
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// NEW: @desc    Change User Password from Profile Settings
// @route   PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    // Find the logged-in user (req.user is populated by the 'protect' middleware)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // Hash and save the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: 'Server error while changing password.', error: error.message });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword, changePassword };