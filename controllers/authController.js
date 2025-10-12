const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendMagicLink, sendVerificationEmail } = require('../services/emailService');

const requestMagicLink = async (req, res) => {
  try {
    console.log('\n🔐 [MAGIC-LINK] ===== REQUEST STARTED =====');
    console.log('[MAGIC-LINK] Request Body:', req.body);
    const { email } = req.body;

    if (!email) {
      console.error('[MAGIC-LINK] ❌ No email provided');
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log(`[MAGIC-LINK] 📧 Processing magic link request for: ${email}`);
    let user = await User.findOne({ email });

    if (!user) {
      console.log('[MAGIC-LINK] 🆕 Creating new user account');
      user = new User({
        email,
        password: crypto.randomBytes(32).toString('hex'),
        role: 'user',
        isVerified: true,
      });
      await user.save();
      console.log(`[MAGIC-LINK] ✅ New user created with ID: ${user._id}`);
    }

    const magicToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const magicUrl = `${process.env.CLIENT_URL}/magic-login/${magicToken}`;
    
    console.log(`[MAGIC-LINK] 📨 Sending email to: ${email}`);
    await sendMagicLink(email, magicToken);

    console.log(`[MAGIC-LINK] ✅ Magic link email sent successfully`);
    console.log('[MAGIC-LINK] ===== REQUEST COMPLETED =====\n');
    res.json({ message: 'Magic link sent to your email' });

  } catch (error) {
    // This block will now catch detailed errors from the Nodemailer service
    console.error('[MAGIC-LINK] ❌ An error stopped the request:', error.message);
    res.status(500).json({ message: 'Server error: Could not send magic link.', error: error.message });
  }
};


const connectWallet = async (req, res) => {
  try {
    console.log('\n🔗 [WALLET-CONNECT] ===== REQUEST STARTED =====');
    console.log('[WALLET-CONNECT] Request Headers:', {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      origin: req.headers.origin,
      authorization: req.headers.authorization ? 'Bearer token present' : 'No token'
    });
    console.log('[WALLET-CONNECT] Request Body:', req.body);

    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      console.error('[WALLET-CONNECT] ❌ Missing wallet address, signature, or message');
      return res.status(400).json({
        message: 'Wallet address, signature, and message are required'
      });
    }

    console.log(`[WALLET-CONNECT] 🔍 Processing wallet connection for: ${walletAddress}`);
    console.log(`[WALLET-CONNECT] 📝 Message to verify: "${message}"`);

    // Check if user is authenticated
    if (!req.user) {
      console.error('[WALLET-CONNECT] ❌ No authenticated user found');
      console.log('[WALLET-CONNECT] 💡 User must login first via magic link or traditional login');
      return res.status(401).json({ message: 'Please login first to connect your wallet' });
    }

    console.log(`[WALLET-CONNECT] 👤 Authenticated user: ${req.user.email} (ID: ${req.user._id})`);

    // Verify the signature
    console.log(`[WALLET-CONNECT] 🔐 Verifying wallet signature...`);
    const isValidSignature = await verifyWalletSignature(walletAddress, message, signature);

    if (!isValidSignature) {
      console.error(`[WALLET-CONNECT] ❌ Invalid signature for wallet: ${walletAddress}`);
      return res.status(400).json({
        message: 'Invalid wallet signature. Please sign the message with your wallet.'
      });
    }

    console.log(`[WALLET-CONNECT] ✅ Signature verified successfully`);

    // Check if wallet is already connected to another account
    const existingWallet = await User.findOne({
      walletAddress,
      _id: { $ne: req.user._id }
    });

    if (existingWallet) {
      // If the existing wallet is connected to a wallet.local account, transfer it
      if (existingWallet.email.endsWith('@wallet.local')) {
        console.log(`[WALLET-CONNECT] 🔄 Transferring wallet from wallet.local account: ${existingWallet.email}`);

        // Remove wallet from the old wallet.local account
        existingWallet.walletAddress = undefined;
        await existingWallet.save();

        console.log(`[WALLET-CONNECT] ✅ Wallet transferred from wallet.local account`);
      } else {
        console.error(`[WALLET-CONNECT] ❌ Wallet already connected to another real account: ${existingWallet.email}`);
        return res.status(400).json({
          message: 'This wallet is already connected to another account'
        });
      }
    }

    console.log(`[WALLET-CONNECT] 🔗 Connecting verified wallet to user account`);
    req.user.walletAddress = walletAddress;
    req.user.lastLogin = new Date();
    await req.user.save();

    console.log(`[WALLET-CONNECT] ✅ Wallet connected successfully`);
    console.log(`[WALLET-CONNECT] 📋 Updated user details:`, {
      id: req.user._id,
      email: req.user.email,
      walletAddress: req.user.walletAddress,
      role: req.user.role
    });
    console.log('[WALLET-CONNECT] ===== REQUEST COMPLETED =====\n');

    res.json({
      message: 'Wallet connected successfully',
      user: {
        id: req.user._id,
        email: req.user.email,
        walletAddress: req.user.walletAddress,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('[WALLET-CONNECT] ❌ Error occurred:', error.message);
    console.error('[WALLET-CONNECT] Stack trace:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyWalletSignature = async (walletAddress, message, signature) => {
  try {
    console.log(`[WALLET-VERIFY] 🔐 Verifying signature for wallet: ${walletAddress}`);
    console.log(`[WALLET-VERIFY] 📝 Original message: "${message}"`);
    console.log(`[WALLET-VERIFY] ✍️ Signature: ${signature.substring(0, 20)}...${signature.substring(signature.length - 10)}`);

    const { ethers } = require('ethers');

    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    console.log(`[WALLET-VERIFY] 🔍 Recovered address: ${recoveredAddress}`);
    console.log(`[WALLET-VERIFY] 🔍 Expected address: ${walletAddress}`);

    // Compare addresses (case-insensitive)
    const isValid = recoveredAddress.toLowerCase() === walletAddress.toLowerCase();

    if (isValid) {
      console.log(`[WALLET-VERIFY] ✅ Signature verification passed - addresses match!`);
      return true;
    } else {
      console.log(`[WALLET-VERIFY] ❌ Signature verification failed - addresses don't match`);
      console.log(`[WALLET-VERIFY] Expected: ${walletAddress.toLowerCase()}`);
      console.log(`[WALLET-VERIFY] Got: ${recoveredAddress.toLowerCase()}`);
      return false;
    }
  } catch (error) {
    console.error(`[WALLET-VERIFY] ❌ Error verifying signature:`, error.message);
    console.error(`[WALLET-VERIFY] Stack trace:`, error.stack);
    return false;
  }
};

const getWalletMessage = async (req, res) => {
  try {
    console.log('\n📝 [WALLET-MESSAGE] ===== REQUEST STARTED =====');
    console.log('[WALLET-MESSAGE] Request Headers:', {
      'user-agent': req.headers['user-agent'],
      origin: req.headers.origin
    });

    const { walletAddress } = req.params;

    if (!walletAddress) {
      console.error('[WALLET-MESSAGE] ❌ No wallet address provided');
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    console.log(`[WALLET-MESSAGE] 🔍 Generating message for wallet: ${walletAddress}`);

    // Check if user is authenticated
    if (!req.user) {
      console.error('[WALLET-MESSAGE] ❌ No authenticated user found');
      return res.status(401).json({ message: 'Please login first' });
    }

    // Generate a unique message for this wallet connection
    const timestamp = Date.now();
    const message = `Connect wallet ${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)} to Kryptronix account at ${timestamp}`;

    console.log(`[WALLET-MESSAGE] 📝 Generated message: "${message}"`);
    console.log('[WALLET-MESSAGE] ===== REQUEST COMPLETED =====\n');

    res.json({
      message,
      walletAddress,
      timestamp,
      instructions: 'Please sign this message with your wallet to prove ownership'
    });
  } catch (error) {
    console.error('[WALLET-MESSAGE] ❌ Error occurred:', error.message);
    console.error('[WALLET-MESSAGE] Stack trace:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyMagicLink = async (req, res) => {
  try {
    console.log('\n🎫 [MAGIC-LINK-VERIFY] ===== REQUEST STARTED =====');
    console.log('[MAGIC-LINK-VERIFY] Request URL:', req.url);
    console.log('[MAGIC-LINK-VERIFY] Request Headers:', {
      'user-agent': req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer
    });

    const { token } = req.params;
    console.log(`[MAGIC-LINK-VERIFY] 🔍 Verifying token: ${token.substring(0, 50)}...`);

    if (!token) {
      console.error('[MAGIC-LINK-VERIFY] ❌ No token provided');
      return res.status(400).json({ message: 'Token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[MAGIC-LINK-VERIFY] ✅ Token decoded successfully:`, {
      userId: decoded.userId,
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toISOString()
    });

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.error(`[MAGIC-LINK-VERIFY] ❌ User not found for ID: ${decoded.userId}`);
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log(`[MAGIC-LINK-VERIFY] 👤 User found: ${user.email} (ID: ${user._id})`);
    console.log(`[MAGIC-LINK-VERIFY] 📋 User details:`, {
      role: user.role,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      walletAddress: user.walletAddress || 'Not connected'
    });

    user.lastLogin = new Date();
    await user.save();
    console.log(`[MAGIC-LINK-VERIFY] 📅 Updated last login time`);

    const sessionToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log(`[MAGIC-LINK-VERIFY] 🎫 Generated session token (expires in 7 days)`);

    console.log(`[MAGIC-LINK-VERIFY] ✅ Magic link verification successful`);
    console.log(`[MAGIC-LINK-VERIFY] 🔄 Redirecting to: ${process.env.CLIENT_URL}`);
    console.log('[MAGIC-LINK-VERIFY] ===== REQUEST COMPLETED =====\n');

    res.json({
      token: sessionToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('[MAGIC-LINK-VERIFY] ❌ Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.error('[MAGIC-LINK-VERIFY] ❌ Invalid token:', error.message);
    } else {
      console.error('[MAGIC-LINK-VERIFY] ❌ Error occurred:', error.message);
    }
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const signup = async (req, res) => {
  try {
    console.log('\n📝 [SIGNUP] ===== REQUEST STARTED =====');
    console.log('[SIGNUP] Request Headers:', {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      origin: req.headers.origin
    });
    console.log('[SIGNUP] Request Body:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.error('[SIGNUP] ❌ Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log(`[SIGNUP] 📧 Checking if user already exists: ${email}`);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`[SIGNUP] ❌ User already exists: ${email}`);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log(`[SIGNUP] ✅ Email available, creating new account`);

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log(`[SIGNUP] 🔐 Password hashed and verification token generated`);

    const user = new User({
      email,
      password: hashedPassword,
      verificationToken,
      role: 'user',
      isVerified: false,
    });

    await user.save();
    console.log(`[SIGNUP] ✅ New user created with ID: ${user._id}`);

    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:8080'}/verify/${verificationToken}`;
    console.log(`[SIGNUP] 🔗 Verification URL: ${verificationUrl}`);

    console.log(`[SIGNUP] 📨 Sending verification email to: ${email}`);
    await sendVerificationEmail(email, verificationToken);

    console.log(`[SIGNUP] ✅ Verification email sent successfully`);
    console.log('[SIGNUP] ===== REQUEST COMPLETED =====\n');

    res.json({ message: 'Signup successful! Check your email to verify your account.' });
  } catch (error) {
    console.error('[SIGNUP] ❌ Error occurred:', error.message);
    console.error('[SIGNUP] Stack trace:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    console.log('\n🔑 [LOGIN] ===== REQUEST STARTED =====');
    console.log('[LOGIN] Request Headers:', {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      origin: req.headers.origin
    });
    console.log('[LOGIN] Request Body:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.error('[LOGIN] ❌ Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log(`[LOGIN] 🔍 Looking up user: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[LOGIN] ❌ User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`[LOGIN] 👤 User found: ${user.email} (ID: ${user._id})`);
    console.log(`[LOGIN] 📋 User status:`, {
      isVerified: user.isVerified,
      role: user.role,
      lastLogin: user.lastLogin
    });

    if (!user.isVerified) {
      console.log(`[LOGIN] ❌ Account not verified: ${email}`);
      return res.status(401).json({ message: 'Please verify your email first' });
    }

    console.log(`[LOGIN] 🔐 Verifying password for: ${email}`);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[LOGIN] ❌ Password mismatch for: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`[LOGIN] ✅ Password verified successfully`);

    user.lastLogin = new Date();
    await user.save();
    console.log(`[LOGIN] 📅 Updated last login time`);

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log(`[LOGIN] 🎫 Generated session token (expires in 7 days)`);

    console.log(`[LOGIN] ✅ Login successful for: ${email}`);
    console.log('[LOGIN] ===== REQUEST COMPLETED =====\n');

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[LOGIN] ❌ Error occurred:', error.message);
    console.error('[LOGIN] Stack trace:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    console.log('\n✅ [VERIFY-EMAIL] ===== REQUEST STARTED =====');
    console.log('[VERIFY-EMAIL] Request URL:', req.url);
    console.log('[VERIFY-EMAIL] Request Headers:', {
      'user-agent': req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer
    });

    const { token } = req.params;
    console.log(`[VERIFY-EMAIL] 🔍 Looking up verification token: ${token.substring(0, 20)}...`);

    if (!token) {
      console.error('[VERIFY-EMAIL] ❌ No token provided');
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      console.error(`[VERIFY-EMAIL] ❌ Invalid verification token: ${token.substring(0, 20)}...`);
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    console.log(`[VERIFY-EMAIL] 👤 User found: ${user.email} (ID: ${user._id})`);
    console.log(`[VERIFY-EMAIL] 📋 User status before verification:`, {
      isVerified: user.isVerified,
      role: user.role,
      verificationToken: user.verificationToken ? 'Present' : 'Not present'
    });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    console.log(`[VERIFY-EMAIL] ✅ Email verified successfully for: ${user.email}`);
    console.log(`[VERIFY-EMAIL] 📋 User status after verification:`, {
      isVerified: user.isVerified,
      role: user.role,
      verificationToken: user.verificationToken
    });
    console.log('[VERIFY-EMAIL] ===== REQUEST COMPLETED =====\n');

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('[VERIFY-EMAIL] ❌ Error occurred:', error.message);
    console.error('[VERIFY-EMAIL] Stack trace:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { requestMagicLink, verifyMagicLink, connectWallet, signup, login, verifyEmail, getWalletMessage };