const crypto = require('crypto');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Prevents duplicate accounts
  },
  password: {
    type: String,
    required: true,
  },
  // CORRECT PLACEMENT: These must go inside the schema object!
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
}, { timestamps: true }); // Automatically adds createdAt and updatedAt dates


// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate a random token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash the token and set it to the resetPasswordToken field in the database
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set the expiration to 10 minutes from now
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken; // We return the unhashed token to send in the email
};

module.exports = mongoose.model('User', userSchema);