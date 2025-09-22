const Admin = require('../models/Admin');
const Log = require('../models/Log');
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

// @desc    Get all admins
// @route   GET /api/admins
// @access  Private (SuperAdmin only)
const getAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { isActive: true };

    const admins = await Admin.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-passwordHash')
      .populate('createdBy', 'name email')
      .lean();

    const total = await Admin.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: admins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admins'
    });
  }
};

// @desc    Create new admin
// @route   POST /api/admins
// @access  Private (SuperAdmin only)
const createAdmin = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      department, 
      designation, 
      role = 'admin' 
    } = req.body;

    // Validate required fields (department and designation are now optional)
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and phone are required'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }

    // Create new admin with optional fields
    const adminData = {
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save middleware
      phone: phone.trim(),
      role,
      createdBy: req.admin.id,
      isActive: true
    };

    // Add optional fields if provided
    if (department) adminData.department = department.trim();
    if (designation) adminData.designation = designation.trim();

    const admin = new Admin(adminData);
    await admin.save();

    // Create audit log
    await Log.createLog(req.admin.id, 'create', 'Admin', admin._id, {
      name: admin.name,
      email: admin.email,
      department: admin.department || 'Not specified',
      designation: admin.designation || 'Not specified',
      role: admin.role,
      createdBy: req.admin.email
    }, req);

    const newAdmin = await Admin.findById(admin._id)
      .select('-passwordHash')
      .populate('createdBy', 'name email');

    logger.info(`Admin created by superadmin ${req.admin.email}: ${admin.email}`);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: newAdmin
    });

  } catch (error) {
    logger.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin'
    });
  }
};

// @desc    Get admin by ID
// @route   GET /api/admins/:id
// @access  Private (Superadmin only)
const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id)
      .select('-passwordHash')
      .lean();

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });

  } catch (error) {
    logger.error('Get admin by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin'
    });
  }
};

// @desc    Update admin
// @route   PUT /api/admins/:id
// @access  Private (Superadmin only)
const updateAdmin = async (req, res) => {
  try {
    const { 
      name,
      email, 
      password, 
      phone,
      department,
      designation,
      role, 
      isActive 
    } = req.body;
    const updateData = {};

    // Handle basic fields
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase();
    if (password) updateData.passwordHash = password; // Will be hashed by pre-save middleware
    if (phone) updateData.phone = phone.trim();
    if (department) updateData.department = department.trim();
    if (designation) updateData.designation = designation.trim();
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-passwordHash');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Create audit log
    await Log.createLog(req.admin.id, 'update', 'Admin', admin._id, {
      email: admin.email,
      changes: req.body,
      updatedBy: req.admin.email
    }, req);

    logger.info(`Admin updated by superadmin ${req.admin.email}: ${admin.email}`);

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: admin
    });

  } catch (error) {
    logger.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin'
    });
  }
};

// @desc    Deactivate admin
// @route   DELETE /api/admins/:id
// @access  Private (Superadmin only)
const deactivateAdmin = async (req, res) => {
  try {
    // Prevent superadmin from deactivating themselves
    if (req.params.id === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-passwordHash');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Create audit log
    await Log.createLog(req.admin.id, 'delete', 'Admin', admin._id, {
      email: admin.email,
      deactivatedBy: req.admin.email
    }, req);

    logger.info(`Admin deactivated by superadmin ${req.admin.email}: ${admin.email}`);

    res.status(200).json({
      success: true,
      message: 'Admin deactivated successfully'
    });

  } catch (error) {
    logger.error('Deactivate admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate admin'
    });
  }
};

module.exports = {
  getAdmins,
  createAdmin,
  getAdminById,
  updateAdmin,
  deactivateAdmin
};