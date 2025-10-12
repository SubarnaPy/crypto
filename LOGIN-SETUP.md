# Login Functionality Setup Guide

## Features Implemented

### Backend
- ✅ User and Admin role-based authentication
- ✅ Email verification with nodemailer
- ✅ Login notification emails
- ✅ JWT token-based authentication
- ✅ Protected routes with middleware
- ✅ Password hashing with bcrypt

### Frontend
- ✅ Login/Signup component with role selection
- ✅ Email verification page
- ✅ Token storage in localStorage
- ✅ Role-based navigation (user/admin)

## API Endpoints

### Public Routes
- `POST /api/auth/signup` - Register new user/admin
- `POST /api/auth/login` - Login user/admin
- `GET /api/auth/verify/:token` - Verify email

### Protected Routes
- `GET /api/auth/me` - Get current user (requires authentication)
- `GET /api/auth/admin/dashboard` - Admin only route

## Environment Variables

Update `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/kryptonics
JWT_SECRET=your-super-secret-jwt-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLIENT_URL=http://localhost:5173
PORT=5000
```

## Gmail Setup for Nodemailer

1. Enable 2-Factor Authentication in your Google Account
2. Generate App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASS`

## Usage

### Start Backend
```bash
cd backend
npm install
npm start
```

### Start Frontend
```bash
npm install
npm run dev
```

### Test Flow

1. **Signup**: Navigate to `/login` → Select role (User/Admin) → Enter email/password → Click Sign Up
2. **Email Verification**: Check email → Click verification link
3. **Login**: Enter credentials → Receive login notification email → Redirected based on role
4. **Access**: Users → `/user-console`, Admins → `/admin-console`

## Request Examples

### Signup
```json
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "user"
  }
}
```

## Email Templates

### Verification Email
- Subject: "Verify Your Email"
- Contains verification link

### Login Notification
- Subject: "Login Notification"
- Contains: Role, Time, IP Address
- Security alert message

## Frontend Integration

```typescript
// Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
localStorage.setItem('token', data.token);

// Protected API calls
fetch('http://localhost:5000/api/auth/me', {
  headers: { 
    'Authorization': `Bearer ${localStorage.getItem('token')}` 
  }
});
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT tokens with 7-day expiration
- Email verification required before login
- Role-based access control
- Login notification emails
- IP address tracking
