const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Admin login validation
const validateAdminLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Document upload validation
const validateDocumentUpload = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('idNumber')
    .notEmpty()
    .withMessage('ID number is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('ID number must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\-_\/\s]+$/)
    .withMessage('ID number can only contain letters, numbers, hyphens, underscores, forward slashes, and spaces'),
  body('jobTitle')
    .notEmpty()
    .withMessage('Job title is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Job title must be between 2 and 100 characters'),
  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  handleValidationErrors
];

// Verification status update validation
const validateVerificationUpdate = [
  body('status')
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be pending, approved, or rejected'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  handleValidationErrors
];

// User creation/update validation
const validateUser = [
  body('certificateId')
    .notEmpty()
    .withMessage('Certificate ID is required')
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage('Certificate ID can only contain alphanumeric characters, hyphens, and underscores'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('company')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('position')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Position cannot exceed 100 characters'),
  body('fromDate')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid date'),
  body('toDate')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.fromDate && value && new Date(value) < new Date(req.body.fromDate)) {
        throw new Error('To date must be after or equal to from date');
      }
      return true;
    }),
  body('certificateUrl')
    .optional()
    .isURL()
    .withMessage('Certificate URL must be a valid URL'),
  handleValidationErrors
];

// Admin creation validation
const validateAdminCreation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters'),
  body('designation')
    .notEmpty()
    .withMessage('Designation is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Designation must be between 2 and 100 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'superadmin'])
    .withMessage('Role must be either admin or superadmin'),
  handleValidationErrors
];

// Certificate ID parameter validation
const validateCertificateId = [
  param('certificateId')
    .notEmpty()
    .withMessage('Certificate ID is required')
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage('Invalid certificate ID format'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('q')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),
  handleValidationErrors
];

// MongoDB ObjectId validation (parameter)
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

module.exports = {
  validateAdminLogin,
  validateDocumentUpload,
  validateVerificationUpdate,
  validateUser,
  validateAdminCreation,
  validateCertificateId,
  validatePagination,
  validateObjectId,
  handleValidationErrors
};