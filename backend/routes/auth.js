const express = require('express');
const rateLimit = require('express-rate-limit');
const { loginAdmin, getProfile, logoutAdmin } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');
const { validateAdminLogin } = require('../middleware/validate');

const router = express.Router();

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT) || 5, // 5 attempts per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Admin login
// @access  Public (rate limited)
router.post('/login', 
  authRateLimit,
  validateAdminLogin,
  loginAdmin
);

// @route   GET /api/auth/profile
// @desc    Get current admin profile
// @access  Private (Admin)
router.get('/profile', 
  authMiddleware,
  getProfile
);

// @route   POST /api/auth/logout
// @desc    Logout admin (for audit logging)
// @access  Private (Admin)
router.post('/logout', 
  authMiddleware,
  logoutAdmin
);

module.exports = router;