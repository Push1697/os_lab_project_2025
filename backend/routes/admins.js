const express = require('express');
const { 
  getAdmins, 
  createAdmin, 
  getAdminById, 
  updateAdmin, 
  deactivateAdmin 
} = require('../controllers/admins.controller');
const { authMiddleware, requireSuperAdmin, requireAdmin } = require('../middleware/auth');
const { 
  validateAdminCreation, 
  validatePagination, 
  validateObjectId 
} = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/admins
// @desc    Get all admins (SuperAdmin only)
// @access  Private (SuperAdmin only)
router.get('/', 
  requireSuperAdmin,
  validatePagination,
  getAdmins
);

// @route   POST /api/admins
// @desc    Create new admin (SuperAdmin only)
// @access  Private (SuperAdmin only)
router.post('/', 
  requireSuperAdmin,
  validateAdminCreation,
  createAdmin
);

// @route   GET /api/admins/:id
// @desc    Get admin by ID
// @access  Private (Superadmin only)
router.get('/:id', 
  requireSuperAdmin,
  validateObjectId,
  getAdminById
);

// @route   PUT /api/admins/:id
// @desc    Update admin
// @access  Private (Superadmin only)
router.put('/:id', 
  requireSuperAdmin,
  validateObjectId,
  updateAdmin
);

// @route   DELETE /api/admins/:id
// @desc    Deactivate admin
// @access  Private (Superadmin only)
router.delete('/:id', 
  requireSuperAdmin,
  validateObjectId,
  deactivateAdmin
);

module.exports = router;