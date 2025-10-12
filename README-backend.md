# Backend Setup

## Installation

1. Install dependencies:
```bash
npm install express mongoose bcryptjs jsonwebtoken nodemailer cors dotenv nodemon
```

2. Setup environment variables:
- Copy `.env.backend` to `.env`
- Update MongoDB URI if needed

3. Start the server:
```bash
npm run dev
```

## API Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify/:token` - Verify email

## Usage

1. Signup: Send POST to `/api/auth/signup` with `{ email, password }`
2. Check email for verification link
3. Click verification link or send GET to `/api/auth/verify/:token`
4. Login: Send POST to `/api/auth/login` with `{ email, password }`