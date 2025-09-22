const express = require('express');
const { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getUserStats
} = require('../controllers/users.controller');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const { 
  validateVerificationUpdate,
  validatePagination, 
  validateObjectId 
} = require('../middleware/validate');

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(requireAdmin);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin)
router.get('/stats',
  getUserStats
);

// @route   GET /api/users?q=&page=&limit=&status=
// @desc    Get all users with search and pagination
// @access  Private (Admin)
router.get('/', 
  validatePagination,
  getUsers
);

// @route   GET /api/users/:id
// @desc    Get single user by ID
// @access  Private (Admin)
router.get('/:id', 
  validateObjectId('id'),
  getUserById
);

// @route   PUT /api/users/:id
// @desc    Update user verification status
// @access  Private (Admin)
router.put('/:id', 
  validateObjectId('id'),
  validateVerificationUpdate,
  updateUser
);

// @route   DELETE /api/users/:id
// @desc    Delete user verification record
// @access  Private (Admin)
router.delete('/:id', 
  validateObjectId('id'),
  deleteUser
);

module.exports = router;