const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
  upload, 
  uploadCertificate, 
  deleteCertificate, 
  handleMulterError 
} = require('../controllers/upload.controller');
const {
  upload: documentUpload,
  uploadDocument,
  handleMulterError: documentMulterError
} = require('../controllers/document.controller');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const { validateDocumentUpload } = require('../middleware/validate');

const router = express.Router();

// Rate limiting for document upload
const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.UPLOAD_RATE_LIMIT) || 3, // 3 uploads per hour per IP
  message: {
    success: false,
    message: 'Too many upload attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public document upload for verification
// @route   POST /api/upload/document
// @desc    Upload document for verification
// @access  Public (rate limited)
router.post('/document',
  uploadRateLimit,
  documentUpload.single('document'),
  documentMulterError,
  validateDocumentUpload,
  uploadDocument
);

// Admin routes require authentication
router.use(authMiddleware);
router.use(requireAdmin);

// @route   POST /api/upload/certificate
// @desc    Upload certificate file
// @access  Private (Admin)
router.post('/certificate', 
  upload.single('certificate'),
  handleMulterError,
  uploadCertificate
);

// @route   DELETE /api/upload/certificate
// @desc    Delete certificate file
// @access  Private (Admin)
router.delete('/certificate', 
  deleteCertificate
);

module.exports = router;