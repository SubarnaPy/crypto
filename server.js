const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();

// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const origin = req.headers.origin || 'No Origin';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  console.log(`\n[${timestamp}] ${method} ${url}`);
  console.log(`Origin: ${origin}`);
  console.log(`User-Agent: ${userAgent}`);
  console.log(`Content-Type: ${req.headers['content-type'] || 'Not specified'}`);

  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }

  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[${new Date().toISOString()}] Response Status: ${res.statusCode}`);
    if (data && typeof data === 'string') {
      try {
        const jsonData = JSON.parse(data);
        console.log('Response Data:', JSON.stringify(jsonData, null, 2));
      } catch {
        console.log('Response Data:', data.substring(0, 200) + (data.length > 200 ? '...' : ''));
      }
    }
    originalSend.call(this, data);
  };

  next();
});

// CORS Configuration - supports both development and production
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://kyptronix-wallet.netlify.app',
];

// Add production frontend URL if specified
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn('⚠️  Blocked CORS request from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kryptonics';
console.log('\n🔗 Database Configuration:');
console.log(`MONGODB_URI: ${MONGODB_URI ? '✅ Set' : '❌ Not set'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
console.log(`CLIENT_URL: ${process.env.CLIENT_URL || 'Not set'}`);
console.log(`EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER || 'console'}`);

console.log('\n📦 Connecting to MongoDB...',MONGODB_URI);
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('💡 Make sure MongoDB is running locally or check your MONGODB_URI');
  process.exit(1);
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('\n🚀 Server Started Successfully!');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Email Provider: ${process.env.EMAIL_PROVIDER || 'console'}`);
  console.log(`🔗 CORS Origins: ${JSON.stringify(allowedOrigins, null, 2)}`);
  console.log('\n📋 Available Endpoints:');
  console.log('  POST /api/auth/magic-link - Request magic login link');
  console.log('  GET  /api/auth/magic-login/:token - Verify magic link');
  console.log('  POST /api/auth/wallet-connect - Connect wallet (requires auth)');
  console.log('  POST /api/auth/login - Traditional login');
  console.log('  POST /api/auth/signup - User registration');
  console.log('  GET  /api/auth/me - Get current user info (requires auth)');
  console.log('\n💡 Ready for requests! Magic links will be logged to console.');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});
