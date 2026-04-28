const nodemailer = require('nodemailer');

// Check if email is configured
const isEmailConfigured = () => {
  return process.env.EMAIL_USER && process.env.EMAIL_PASS;
};

// Create email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.ionos.com',
  port: 587,
  secure: false,                  // false = use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Send email function - gracefully skips if email not configured
 */
const sendEmail = async (options) => {
  // Skip email sending if not configured
  if (!isEmailConfigured()) {
    console.log('📧 [Email skipped - not configured] Would have sent:');
    console.log(`   To: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    return { skipped: true };
  }

  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Swift E-Comm & Fulfillment" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    // Don't throw error - let the app continue working
    return { error: err.message };
  }
};

/**
 * Beautiful HTML email template
 */
const emailTemplate = (title, content, ctaText, ctaLink) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { margin:0; padding:0; background:#F7F9FC; font-family: Arial, sans-serif; }
  .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1B3A52, #2C4F6B); padding: 36px 30px; text-align: center; }
  .header h1 { color: white; font-size: 26px; margin: 0; font-weight: 700; }
  .header p { color: #3EAFA8; font-size: 14px; margin: 6px 0 0; letter-spacing: 1px; }
  .content { padding: 40px 30px; color: #1A2940; line-height: 1.7; }
  .content h2 { color: #1B3A52; font-size: 22px; margin-top: 0; }
  .content p { font-size: 15px; color: #64748B; margin-bottom: 16px; }
  .content strong { color: #1B3A52; }
  .btn { display: inline-block; padding: 14px 32px; background: #3EAFA8; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
  .info-box { background: #E8F6F5; border-left: 4px solid #3EAFA8; padding: 16px 20px; border-radius: 6px; margin: 20px 0; }
  .footer { background: #F7F9FC; padding: 24px 30px; text-align: center; color: #94A3B8; font-size: 13px; border-top: 1px solid #E2E8F0; }
  .footer a { color: #3EAFA8; text-decoration: none; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SWIFT E-COMM & FULFILLMENT</h1>
      <p>DELIVERING TOMORROW, TODAY.</p>
    </div>
    <div class="content">
      <h2>${title}</h2>
      ${content}
      ${ctaText ? `<a href="${ctaLink}" class="btn">${ctaText}</a>` : ''}
    </div>
    <div class="footer">
      <p>© 2025 Swift E-Comm & Fulfillment</p>
      <p>United States · Multiple Warehouse Locations</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = { sendEmail, emailTemplate, isEmailConfigured };
