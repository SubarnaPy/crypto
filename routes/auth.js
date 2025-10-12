const express = require('express');
const { requestMagicLink, verifyMagicLink, connectWallet, signup, login, verifyEmail, getWalletMessage } = require('../controllers/authController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify/:token', verifyEmail);
router.post('/magic-link', requestMagicLink);
router.get('/magic-login/:token', verifyMagicLink);
router.get('/wallet-message/:walletAddress', authenticate, getWalletMessage);
router.post('/wallet-connect', authenticate, connectWallet);
router.get('/me', authenticate, (req, res) => {
  res.json({ user: { id: req.user._id, email: req.user.email, role: req.user.role } });
});
router.get('/admin/dashboard', authenticate, authorizeAdmin, (req, res) => {
  res.json({ message: 'Admin dashboard access granted' });
});

module.exports = router;
