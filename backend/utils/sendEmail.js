const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter (Replace with Mailtrap credentials for testing!)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_EMAIL || "your_mailtrap_user",
      pass: process.env.SMTP_PASSWORD || "your_mailtrap_password",
    },
  });

  const message = {
    from: 'Finance Tracker <noreply@financetracker.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  const info = await transporter.sendMail(message);
  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;