# Backend Setup

## Installation
```bash
npm install express mongoose bcryptjs jsonwebtoken nodemailer cors dotenv nodemon
```

## Environment
Rename `backend-env` to `.env`

## Start Server
```bash
node backend-server.js
```

## API Endpoints
- POST `/api/auth/signup` - Register user
- POST `/api/auth/login` - Login user  
- GET `/api/auth/verify/:token` - Verify email

## Files
- `backend-server.js` - Main server
- `backend-User.js` - User model
- `backend-auth.js` - Auth routes
- `backend-emailService.js` - Email service