// Test script to verify Resend configuration
require('dotenv').config();
const { Resend } = require('resend');

async function testResend() {
  console.log('🧪 Testing Resend Configuration\n');
  
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    console.log('💡 Make sure you have a .env file with RESEND_API_KEY=re_xxx');
    return;
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
  
  const resend = new Resend(apiKey);
  
  // Test email - change this to your email
  const testEmail = 'mondalsubarna29@gmail.com';
  const fromEmail = process.env.EMAIL_USER || 'onboarding@resend.dev';
  
  console.log(`📧 From: ${fromEmail}`);
  console.log(`📧 To: ${testEmail}\n`);
  
  try {
    console.log('📤 Sending test email...');
    const result = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: '🧪 Test Email from Resend',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>✅ Resend is Working!</h1>
          <p>This is a test email sent at ${new Date().toISOString()}</p>
          <p>If you received this, your Resend setup is correct.</p>
        </div>
      `,
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📨 Result:', JSON.stringify(result, null, 2));
    
    if (result.error) {
      console.error('\n❌ Error details:', result.error);
    } else {
      console.log('\n💡 Email ID:', result.data.id);
      console.log('\n📋 Next steps:');
      console.log('1. Check your email inbox (and spam folder)');
      console.log('2. If using onboarding@resend.dev, it only sends to your verified Resend account email');
      console.log('3. To send to any email, verify your domain in Resend dashboard');
      console.log('4. Dashboard: https://resend.com/domains');
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.error('\n💡 Common issues:');
    console.error('- Invalid API key');
    console.error('- Sandbox domain (onboarding@resend.dev) can only send to your Resend account email');
    console.error('- Need to verify your domain or add recipient as test email');
  }
}

testResend();
