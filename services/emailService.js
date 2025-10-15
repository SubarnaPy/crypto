
const nodemailer = require('nodemailer');
// EMAIL_USER=tirtho.kyptronix@gmail.com
// EMAIL_PASS=kozi ozmn wtzn cuyg
// --- Step 1: Configure the Gmail Transporter ---
// This uses environment variables for your email and app password for security.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tirtho.kyptronix@gmail.com', // Your Gmail address
    pass: 'kozi ozmn wtzn cuyg', // Your Gmail App Password
  },
});

console.log('📧 Email Service configured for Gmail SMTP.');

const DEFAULT_FROM_EMAIL = 'tirtho.kyptronix@gmail.com';

// --- Step 2: Main Function to Send Emails ---
const sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// --- Step 3: Specific Email Template Functions ---

/**
 * Sends a magic link email.
 * @param {string} email - The recipient's email address.
 * @param {string} token - The magic link token.
 */
const sendMagicLink = async (email, token) => {
  // const magicUrl = `http://localhost:3000/magic-login/${token}`;
  const magicUrl = `https://kyptronix-wallet.netlify.app/magic-login/${token}`;

  return sendEmail({
    from: DEFAULT_FROM_EMAIL,
    to: email,
    subject: 'Your Magic Login Link ✨',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding:40px;text-align:center;">
                    <span style="font-size:40px;">✨</span>
                    <h1 style="margin:20px 0 16px;color:#1a1a1a;font-size:28px;">Magic Link Login</h1>
                    <p style="margin:0 0 32px;color:#666;font-size:16px;">Click the button below to securely sign in.</p>
                    <a href="${magicUrl}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;">Sign In Now</a>
                    <p style="margin:32px 0 0;color:#999;font-size:14px;">This link expires in 10 minutes.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

/**
 * Sends an email verification email.
 * @param {string} email - The recipient's email address.
 * @param {string} token - The verification token.
 */
const sendVerificationEmail = async (email, token) => {
  // const verificationUrl = `http://localhost:3000/verify/${token}`;
  const verificationUrl = `https://kyptronix-wallet.netlify.app/verify/${token}`;
// 
  return sendEmail({
    from: DEFAULT_FROM_EMAIL,
    to: email,
    subject: 'Verify Your Email ✅',
    html: `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding:40px;text-align:center;">
                  <span style="font-size:40px;">✅</span>
                  <h1 style="margin:20px 0 16px;color:#1a1a1a;font-size:28px;">Verify Your Email</h1>
                  <p style="margin:0 0 32px;color:#666;font-size:16px;">Please verify your email to complete registration.</p>
                  <a href="${verificationUrl}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;">Verify Email</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `,
  });
};

module.exports = { sendMagicLink, sendVerificationEmail };