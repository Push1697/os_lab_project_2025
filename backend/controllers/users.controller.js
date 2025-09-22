const DocumentVerification = require('../models/DocumentVerification');
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

// @desc    Get all users (from document verifications) with data isolation
// @route   GET /api/users?q=&page=&limit=
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const { q = '', page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query with data isolation
    let searchQuery = {};
    
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      searchQuery.status = status;
    }

    // Data isolation: Only SuperAdmins can see all users, regular admins see only their created users
    if (req.admin.role !== 'superadmin') {
      searchQuery.createdBy = req.admin.id;
    }

    if (q) {
      searchQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { idNumber: { $regex: q, $options: 'i' } },
        { jobTitle: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const users = await DocumentVerification.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviewedBy', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    // Transform for user-like response
    const transformedUsers = users.map(verification => ({
      _id: verification._id,
      name: verification.name,
      email: verification.email,
      phone: verification.phone,
      idNumber: verification.idNumber,
      verificationStatus: verification.status,
      documentUrl: verification.documentUrl,
      reviewedBy: verification.reviewedBy,
      reviewedAt: verification.reviewedAt,
      createdBy: verification.createdBy,
      notes: verification.notes,
      // Employment fields
      jobTitle: verification.jobTitle,
      department: verification.department,
      employmentStatus: verification.employmentStatus,
      endDate: verification.endDate,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt
    }));

    // Get total count for pagination
    const total = await DocumentVerification.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      data: transformedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// @desc    Get single user by ID with data isolation
// @route   GET /api/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
  try {
    // Build query with data isolation
    const query = { _id: req.params.id };
    
    // Data isolation: Only SuperAdmins can see all users, regular admins see only their created users
    if (req.admin.role !== 'superadmin') {
      query.createdBy = req.admin.id;
    }

    const verification = await DocumentVerification.findOne(query)
      .populate('reviewedBy', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'User not found or you do not have permission to view it'
      });
    }

    // Transform for user-like response
    const user = {
      _id: verification._id,
      name: verification.name,
      email: verification.email,
      phone: verification.phone,
      idNumber: verification.idNumber,
      verificationStatus: verification.status,
      documentUrl: verification.documentUrl,
      documentType: verification.documentType,
      documentSize: verification.documentSize,
      reviewedBy: verification.reviewedBy,
      reviewedAt: verification.reviewedAt,
      createdBy: verification.createdBy,
      notes: verification.notes,
      // Employment fields
      jobTitle: verification.jobTitle,
      department: verification.department,
      employmentStatus: verification.employmentStatus,
      endDate: verification.endDate,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt
    };

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

// @desc    Update user verification status with data isolation
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, approved, or rejected'
      });
    }

    // Build query with data isolation
    const query = { _id: req.params.id };
    
    // Data isolation: Only SuperAdmins can update any user, regular admins can only update their own
    if (req.admin.role !== 'superadmin') {
      query.createdBy = req.admin.id;
    }

    const verification = await DocumentVerification.findOne(query);
    
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'User not found or you do not have permission to update it'
      });
    }

    // Update verification
    if (status) verification.status = status;
    if (notes !== undefined) verification.notes = notes;
    
    if (status) {
      verification.reviewedBy = req.admin.id;
      verification.reviewedAt = new Date();
    }

    await verification.save();

    // Create audit log
    await Log.createLog(req.admin.id, 'update', 'DocumentVerification', verification._id, {
      email: verification.email,
      name: verification.name,
      oldStatus: verification.status,
      newStatus: status,
      notes,
      updatedBy: req.admin.email
    }, req);

    logger.info(`User verification updated by admin ${req.admin.email}: ${verification.email}`);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: verification._id,
        name: verification.name,
        email: verification.email,
        verificationStatus: verification.status,
        notes: verification.notes,
        reviewedAt: verification.reviewedAt
      }
    });

  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

// @desc    Delete user verification with data isolation
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    // Build query with data isolation
    const query = { _id: req.params.id };
    
    // Data isolation: Only SuperAdmins can delete any user, regular admins can only delete their own
    if (req.admin.role !== 'superadmin') {
      query.createdBy = req.admin.id;
    }

    const verification = await DocumentVerification.findOne(query);
    
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'User not found or you do not have permission to delete it'
      });
    }

    await verification.deleteOne();

    // Create audit log
    await Log.createLog(req.admin.id, 'delete', 'DocumentVerification', verification._id, {
      email: verification.email,
      name: verification.name,
      deletedBy: req.admin.email
    }, req);

    logger.info(`User verification deleted by admin ${req.admin.email}: ${verification.email}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// @desc    Get user statistics with data isolation
// @route   GET /api/users/stats
// @access  Private (Admin)
const getUserStats = async (req, res) => {
  try {
    // Build query with data isolation
    const query = {};
    
    // Data isolation: Only SuperAdmins can see all stats, regular admins see only their own data
    if (req.admin.role !== 'superadmin') {
      query.createdBy = req.admin.id;
    }

    const stats = await DocumentVerification.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
};