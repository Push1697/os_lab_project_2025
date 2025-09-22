const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
  getVerification,
  getAllVerifications,
  updateVerificationStatus,
  updateEmploymentStatus,
  deleteVerification,
  getVerificationStats
} = require('../controllers/document.controller');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const { 
  validateVerificationUpdate,
  validateObjectId 
} = require('../middleware/validate');

const router = express.Router();

// Rate limiting for verification checks
const verifyRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.VERIFY_RATE_LIMIT) || 30, // 30 requests per minute per IP
  message: {
    success: false,
    message: 'Too many verification requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public Routes

// @route   GET /api/document/verify/:id
// @desc    Get verification status by ID
// @access  Public (rate limited)
router.get('/verify/:id',
  verifyRateLimit,
  validateObjectId('id'),
  getVerification
);

// Admin Routes (require authentication)

// @route   POST /api/document/upload
// @desc    Upload document for verification (Admin)
// @access  Private (Admin)
const { upload: documentUpload, uploadDocument, handleMulterError: documentMulterError } = require('../controllers/document.controller');

router.post('/upload',
  authMiddleware,
  requireAdmin,
  documentUpload.single('document'),
  documentMulterError,
  uploadDocument
);

// @route   GET /api/document/verifications
// @desc    Get all verifications with pagination
// @access  Private (Admin)
router.get('/verifications',
  authMiddleware,
  requireAdmin,
  getAllVerifications
);

// @route   PUT /api/document/verify/:id
// @desc    Update verification status
// @access  Private (Admin)
router.put('/verify/:id',
  authMiddleware,
  requireAdmin,
  validateObjectId('id'),
  validateVerificationUpdate,
  updateVerificationStatus
);

// @route   PATCH /api/document/:id/employment-status
// @desc    Update employment status
// @access  Private (Admin)
router.patch('/:id/employment-status',
  authMiddleware,
  requireAdmin,
  validateObjectId('id'),
  updateEmploymentStatus
);

// @route   DELETE /api/document/verify/:id
// @desc    Delete verification record
// @access  Private (Admin)
router.delete('/verify/:id',
  authMiddleware,
  requireAdmin,
  validateObjectId('id'),
  deleteVerification
);

// @route   GET /api/document/stats
// @desc    Get verification statistics
// @access  Private (Admin)
router.get('/stats',
  authMiddleware,
  requireAdmin,
  getVerificationStats
);

module.exports = router;