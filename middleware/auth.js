const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    console.log('\n🔐 [AUTH-MIDDLEWARE] ===== AUTHENTICATION CHECK =====');
    console.log('[AUTH-MIDDLEWARE] Request URL:', req.url);
    console.log('[AUTH-MIDDLEWARE] Request Method:', req.method);

    const authHeader = req.headers.authorization;
    console.log(`[AUTH-MIDDLEWARE] 🔍 Authorization header: ${authHeader ? 'Present' : 'Missing'}`);

    if (!authHeader) {
      console.error('[AUTH-MIDDLEWARE] ❌ No authorization header provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.error('[AUTH-MIDDLEWARE] ❌ No token found in authorization header');
      return res.status(401).json({ message: 'Authentication token required' });
    }

    console.log(`[AUTH-MIDDLEWARE] 🔑 Verifying JWT token...`);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log(`[AUTH-MIDDLEWARE] ✅ Token decoded successfully:`, {
      userId: decoded.userId,
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toISOString()
    });

    console.log(`[AUTH-MIDDLEWARE] 👤 Looking up user: ${decoded.userId}`);
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.error(`[AUTH-MIDDLEWARE] ❌ User not found for ID: ${decoded.userId}`);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log(`[AUTH-MIDDLEWARE] ✅ User authenticated: ${user.email} (${user.role})`);
    console.log(`[AUTH-MIDDLEWARE] 📋 User details:`, {
      id: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      walletAddress: user.walletAddress || 'Not connected'
    });

    req.user = user;
    console.log('[AUTH-MIDDLEWARE] ===== AUTHENTICATION SUCCESSFUL =====\n');
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('[AUTH-MIDDLEWARE] ❌ Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.error('[AUTH-MIDDLEWARE] ❌ Invalid token:', error.message);
    } else {
      console.error('[AUTH-MIDDLEWARE] ❌ Authentication error:', error.message);
    }
    console.error('[AUTH-MIDDLEWARE] Stack trace:', error.stack);
    res.status(401).json({ message: 'Invalid token' });
  }
};

const authorizeAdmin = (req, res, next) => {
  console.log('\n👑 [AUTH-MIDDLEWARE] ===== ADMIN AUTHORIZATION CHECK =====');
  console.log(`[AUTH-MIDDLEWARE] 🔍 Checking admin access for user: ${req.user.email}`);

  if (req.user.role !== 'admin') {
    console.error(`[AUTH-MIDDLEWARE] ❌ Access denied. User role: ${req.user.role}`);
    return res.status(403).json({ message: 'Admin access required' });
  }

  console.log(`[AUTH-MIDDLEWARE] ✅ Admin access granted for: ${req.user.email}`);
  console.log('[AUTH-MIDDLEWARE] ===== ADMIN AUTHORIZATION SUCCESSFUL =====\n');
  next();
};

module.exports = { authenticate, authorizeAdmin };
