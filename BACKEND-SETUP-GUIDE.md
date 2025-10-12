# Backend Setup Guide

## Manual Setup Required

Since directory creation is restricted, please manually create the backend folder structure:

### Step 1: Create Directory Structure
```
neeew/
└── backend/
    ├── models/
    ├── routes/
    ├── utils/
    └── .env
```

### Step 2: Move Files

**Move these files into backend/ folder:**
- `backend-server.js` → `backend/server.js`
- `backend-package.json` → `backend/package.json`
- `backend-env` → `backend/.env`

**Move into backend/models/:**
- `backend-User.js` → `backend/models/User.js`

**Move into backend/routes/:**
- `backend-auth.js` → `backend/routes/auth.js`

**Move into backend/utils/:**
- `backend-emailService.js` → `backend/utils/emailService.js`

### Step 3: Update Imports in server.js
```javascript
const authRoutes = require('./routes/auth');
```

### Step 4: Update Imports in routes/auth.js
```javascript
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/emailService');
```

### Step 5: Install Dependencies
```bash
cd backend
npm install
```

### Step 6: Run Server
```bash
npm run dev
```

## API Endpoints
- POST `/api/auth/signup` - Register user
- POST `/api/auth/login` - Login user
- GET `/api/auth/verify/:token` - Verify email