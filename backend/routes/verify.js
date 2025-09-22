const express = require('express');
const rateLimit = require('express-rate-limit');
const { getVerification } = require('../controllers/document.controller');
const { verifyCertificate, verifyIdDocument, getVerificationStatus } = require('../controllers/verify.controller');
const { validateObjectId } = require('../middleware/validate');

const router = express.Router();

// Rate limiting for verification endpoint
const verifyRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.VERIFY_RATE_LIMIT) || 60, // 60 requests per minute per IP
  message: {
    success: false,
    message: 'Too many verification requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many verification requests. Please try again later.'
    });
  }
});

// @route   GET /api/verify/:id
// @desc    Get document verification status by ID (Public endpoint)
// @access  Public (rate limited)
router.get('/:id', 
  verifyRateLimit,
  validateObjectId('id'),
  getVerification
);

// @route   GET /api/verify/certificate/:certificateId
// @desc    Verify certificate by ID (legacy endpoint)
// @access  Public (rate limited)
router.get('/certificate/:certificateId', 
  verifyRateLimit,
  verifyCertificate
);

// @route   GET /api/verify/id/:idNumber
// @desc    Verify ID document by ID number
// @access  Public (rate limited)
router.get('/id/:idNumber', 
  verifyRateLimit,
  verifyIdDocument
);

// @route   GET /api/verify/status/:idNumber
// @desc    Get verification status by ID number
// @access  Public (rate limited)
router.get('/status/:idNumber', 
  verifyRateLimit,
  getVerificationStatus
);

// @route   GET /api/verify
// @desc    Get all verifications (Admin endpoint - redirected from document controller)
// @access  Private (Admin) - handled by document.controller
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const { getAllVerifications } = require('../controllers/document.controller');

router.get('/', 
  authMiddleware,
  requireAdmin,
  getAllVerifications
);

module.exports = router;