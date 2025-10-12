# Backend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your actual configuration.

3. **Start the Server**
   ```bash
   npm start
   ```

## 🚀 Production Deployment

For deploying to Render, Vercel, or other cloud platforms, see:
- **[RENDER_DEPLOYMENT.md](../RENDER_DEPLOYMENT.md)** - Complete deployment guide

---

## Email Configuration

The application supports multiple email providers:

### Option 1: Console Mode (Default - Development)
If you don't configure email credentials, the system will automatically fall back to **console logging mode**. Magic links will be printed in your terminal/console, and you can copy them to test the login flow.

**No configuration needed!**

### Option 2: Resend (Recommended for Production)

**Best for cloud deployments (Render, Vercel, etc.)** - Gmail SMTP is often blocked on cloud platforms.

1. **Sign up at [Resend](https://resend.com)**
   - Free tier: 3,000 emails/month, 100 emails/day

2. **Get API Key**
   - Dashboard → API Keys → Create API Key
   - Copy the key (starts with `re_`)

3. **Update .env File**
   ```env
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_your_actual_key_here
   EMAIL_USER=Kryptronix <onboarding@resend.dev>
   ```

4. **Restart the Server**
   ```bash
   npm start
   ```

**For custom domain emails**, add and verify your domain in Resend dashboard, then use:
```env
EMAIL_USER=Kryptronix <noreply@yourdomain.com>
```

### Option 3: Gmail (Local Development Only)

**⚠️ Warning**: Gmail SMTP ports (465, 587) are often blocked on cloud platforms like Render, Vercel, and Railway. Use Resend for production.

1. **Enable 2-Step Verification**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select app: **Mail**
   - Select device: **Other** (Custom name)
   - Enter a name like "Kryptonics Backend"
   - Click **Generate**
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Update .env File**
   ```env
   EMAIL_PROVIDER=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=abcdefghijklmnop  # Remove spaces from the app password
   ```

4. **Restart the Server**
   ```bash
   npm start
   ```

## Authentication Flow

### 1. Magic Link Login
- User enters email on login page
- Backend generates a JWT token (expires in 10 minutes)
- Email with magic link is sent
- User clicks link → automatically logged in

### 2. Wallet Connect (Protected)
- **Requires prior authentication**: Users must login first (via magic link or traditional login)
- Once logged in, users can connect their MetaMask wallet
- Wallet address is linked to their existing account
- Prevents duplicate wallet connections

### 3. Traditional Login/Signup
- Users can also signup with email/password
- Email verification required before login
- Password is hashed with bcrypt

## API Endpoints

### Public Routes
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Traditional login
- `POST /api/auth/magic-link` - Request magic link
- `GET /api/auth/magic-login/:token` - Verify magic link
- `GET /api/auth/verify/:token` - Verify email

### Protected Routes (Require Authentication)
- `POST /api/auth/wallet-connect` - Connect wallet to account
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/admin/dashboard` - Admin only

## Environment Variables Explained

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `CLIENT_URL` | Yes | Frontend URL for magic links |
| `EMAIL_USER` | No* | Gmail address for sending emails |
| `EMAIL_PASS` | No* | Gmail app password |
| `EMAIL_HOST` | No | Custom SMTP host |
| `EMAIL_PORT` | No | Custom SMTP port |

\* If not provided, falls back to console logging mode for development

## Troubleshooting

### "Username and Password not accepted" Error
- You're using a regular Gmail password instead of an App Password
- Solution: Follow the Gmail setup steps above to generate an App Password

### Magic Link Not Working
- Check that `CLIENT_URL` matches your frontend URL
- Verify the link hasn't expired (10-minute timeout)
- Check server console for the magic link URL in development mode

### Wallet Connect Fails
- Ensure user is logged in first
- Check browser console for error messages
- Verify MetaMask is installed and unlocked

### Database Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` is correct
- For local: `mongodb://localhost:27017/kryptonics`

## Security Notes

- Never commit `.env` file to version control
- Use strong `JWT_SECRET` in production
- App Passwords are more secure than regular passwords
- Magic links expire after 10 minutes
- Session tokens expire after 7 days

## Development Tips

1. **View Console Logs**: Run server with `npm start` to see detailed logs
2. **Test Magic Links**: Without email config, links appear in console
3. **Database Inspection**: Use MongoDB Compass or `mongosh` to view data
4. **API Testing**: Use Postman or Thunder Client for endpoint testing

## Support

For issues or questions, check the error logs in your terminal or create an issue in the repository.
