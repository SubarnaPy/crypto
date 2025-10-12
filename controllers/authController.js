// Email service
// Environment variables:
// - EMAIL_PROVIDER: 'resend' or 'gmail' (optional). If omitted, RESEND_API_KEY presence prefers 'resend'.
// - RESEND_API_KEY: API key for Resend (preferred in production). When present, the Resend SDK is used if available.
// - EMAIL_USER, EMAIL_PASS: Gmail SMTP credentials for local development (when EMAIL_PROVIDER=gmail).
// - EMAIL_FROM: The default "from" address for emails (optional).
// Note: The file will try to require('resend') lazily so running locally without the SDK still works.
const nodemailer = require('nodemailer');
let Resend;
try {
  // lazy require so environments without the SDK can still use Gmail transport
  const resendModule = require('resend');
  Resend = resendModule.Resend;
} catch (err) {
  Resend = null;
}

// Consistent "from" address. Uses EMAIL_FROM, falls back to EMAIL_USER, then a default.
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Kryptronix <onboarding@resend.dev>';

// Helper send function - will use Resend API when available, otherwise nodemailer transport
const createEmailService = () => {
  const emailProvider = process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend' : 'gmail');

  console.log(`📧 Email Service: ${emailProvider}`);

  // If using Resend SDK directly (preferred)
  if (emailProvider === 'resend' && process.env.RESEND_API_KEY && Resend) {
    console.log('✅ Using Resend SDK');
    const resendClient = new Resend(process.env.RESEND_API_KEY);

    return {
      sendMail: async ({ from, to, subject, html }) => {
        try {
          const res = await resendClient.emails.send({
            from: from || DEFAULT_FROM_EMAIL,
            to,
            subject,
            html,
          });
          // Resend returns an object with id and status information
          console.log('Resend send result:', res);
          return res;
        } catch (error) {
          console.error('Resend send error:', error);
          throw error;
        }
      },
    };
  }

  // Fallback to SMTP (Gmail or Resend SMTP if explicitly configured)
  if ((emailProvider === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_PASS) || (emailProvider === 'resend' && process.env.RESEND_API_KEY)) {
    if (emailProvider === 'gmail') console.log('✅ Using Gmail SMTP');
    if (emailProvider === 'resend') console.log('✅ Using Resend SMTP');

    const transportConfig = emailProvider === 'gmail'
      ? { 
          host: 'smtp.gmail.com', 
          port: 465, 
          secure: true, 
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } 
        }
      : { host: 'smtp.resend.com', secure: true, port: 465, auth: { user: 'resend', pass: process.env.RESEND_API_KEY } };

    const transporter = nodemailer.createTransport(transportConfig);

    return {
      sendMail: async (mailOptions) => {
        try {
          // Ensure a 'from' address is set if not provided in mailOptions
          const optionsWithFrom = { ...mailOptions, from: mailOptions.from || DEFAULT_FROM_EMAIL };
          const info = await transporter.sendMail(optionsWithFrom);
          console.log('SMTP send info:', info);
          return info;
        } catch (error) {
          console.error('SMTP send error:', error);
          throw error;
        }
      },
    };
  }

  // If no valid email configuration, throw error
  console.error('❌ Email service not configured properly!');
  console.error('💡 Configure email in your .env file:');
  console.error('   For Gmail (local):');
  console.error('   EMAIL_PROVIDER=gmail');
  console.error('   EMAIL_USER=your-email@gmail.com');
  console.error('   EMAIL_PASS=your-app-password');
  console.error('   ');
  console.error('   For Resend (preferred production):');
  console.error('   EMAIL_PROVIDER=resend');
  console.error('   RESEND_API_KEY=re_your_key');
  console.error('   EMAIL_FROM=Kryptronix <onboarding@resend.dev>');
  throw new Error('Email service not configured. Please check your .env file.');
};

// Initialize the service once
const emailService = createEmailService();

const sendMagicLink = async (email, token) => {
  const magicUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/magic-login/${token}`;
  
  return emailService.sendMail({
    from: DEFAULT_FROM_EMAIL,
    to: email,
    subject: 'Your Magic Login Link ✨',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding:40px;text-align:center;">
                    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);width:80px;height:80px;margin:0 auto 24px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
                      <span style="font-size:40px;">✨</span>
                    </div>
                    <h1 style="margin:0 0 16px;color:#1a1a1a;font-size:28px;font-weight:700;">Magic Link Login</h1>
                    <p style="margin:0 0 32px;color:#666;font-size:16px;line-height:1.6;">Click the button below to securely sign in to your account. No password needed!</p>
                    <a href="${magicUrl}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(102,126,234,0.4);transition:all 0.3s;">Sign In Now</a>
                    <p style="margin:32px 0 0;color:#999;font-size:14px;">🔒 This link expires in 10 minutes</p>
                    <p style="margin:8px 0 0;color:#999;font-size:12px;">If you didn't request this, please ignore this email.</p>
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

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${token}`;
  
  return emailService.sendMail({
    from: DEFAULT_FROM_EMAIL,
    to: email,
    subject: 'Verify Your Email ✅',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
            <tr>
                <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                    <tr>
                    <td style="padding:40px;text-align:center;">
                        <div style="background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);width:80px;height:80px;margin:0 auto 24px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
                        <span style="font-size:40px;">✅</span>
                        </div>
                        <h1 style="margin:0 0 16px;color:#1a1a1a;font-size:28px;font-weight:700;">Verify Your Email</h1>
                        <p style="margin:0 0 32px;color:#666;font-size:16px;line-height:1.6;">Welcome! Please verify your email address to complete your registration.</p>
                        <a href="${verificationUrl}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(17,153,142,0.4);transition:all 0.3s;">Verify Email</a>
                        <p style="margin:32px 0 0;color:#999;font-size:12px;">If you didn't create an account, please ignore this email.</p>
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
