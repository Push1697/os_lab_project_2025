const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Log = require('../models/Log');
const { generateToken } = require('../middleware/auth');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public (rate limited)
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      logger.warn(`Login attempt failed - admin not found: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      logger.warn(`Login attempt on locked account: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      logger.warn(`Login attempt on inactive account: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Verify password
    const isValidPassword = await admin.comparePassword(password);

    if (!isValidPassword) {
      // Increment failed login attempts
      await admin.incLoginAttempts();
      logger.warn(`Invalid password attempt for: ${email}`);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0) {
      await admin.resetLoginAttempts();
    }

    // Update last login
    await admin.updateLastLogin();

    // Create audit log
    await Log.createLog(admin._id, 'login', 'Admin', admin._id, {
      email: admin.email,
      loginTime: new Date()
    }, req);

    // Generate JWT token
    const token = generateToken(admin._id, admin.email, admin.role);

    logger.info(`Successful login for admin: ${email}`);

    res.status(200).json({
      success: true,
      token,
      email: admin.email,
      role: admin.role
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current admin profile
// @route   GET /api/auth/profile
// @access  Private (Admin)
const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-passwordHash');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      admin
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout admin (optional - mainly for audit logging)
// @route   POST /api/auth/logout
// @access  Private (Admin)
const logoutAdmin = async (req, res) => {
  try {
    // Create audit log for logout
    await Log.createLog(req.admin.id, 'logout', 'Admin', req.admin.id, {
      email: req.admin.email,
      logoutTime: new Date()
    }, req);

    logger.info(`Admin logged out: ${req.admin.email}`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

module.exports = {
  loginAdmin,
  getProfile,
  logoutAdmin
};