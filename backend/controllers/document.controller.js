const multer = require('multer');
const DocumentVerification = require('../models/DocumentVerification');
const Log = require('../models/Log');
const { uploadFile, deleteFile } = require('../config/aws');
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

// Configure multer for document uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: JPG, PNG, PDF`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// @desc    Upload document for verification
// @route   POST /api/document/upload
// @access  Private (Admin)
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document provided'
      });
    }

    const { name, email, phone, idNumber, jobTitle, department, startDate } = req.body;

    if (!name || !email || !idNumber || !jobTitle || !department || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, ID number, job title, department, and start date are required'
      });
    }

    // Validate start date
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format'
      });
    }

    // Upload document to storage
    const documentUrl = await uploadFile(req.file, 'documents');

    // Create verification record with createdBy field for data isolation
    const verification = new DocumentVerification({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      idNumber: idNumber.trim(),
      jobTitle: jobTitle.trim(),
      department: department.trim(),
      startDate: parsedStartDate,
      employmentStatus: 'active',
      documentUrl,
      documentSize: req.file.size,
      documentMimeType: req.file.mimetype,
      documentType: detectDocumentType(req.file.originalname),
      createdBy: req.admin.id, // Add data isolation
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await verification.save();

    logger.info(`Document verification submitted: ${verification._id} by ${email} (Admin: ${req.admin.email})`);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully for verification',
      verificationId: verification._id,
      data: {
        id: verification._id,
        name: verification.name,
        email: verification.email,
        status: verification.status,
        submittedAt: verification.submittedAt
      }
    });

  } catch (error) {
    logger.error('Upload document error:', error);
    
    // Handle duplicate email
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A verification request already exists for this email'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
};

// @desc    Get verification by ID
// @route   GET /api/document/verify/:id
// @access  Public
const getVerification = async (req, res) => {
  try {
    const verification = await DocumentVerification.findById(req.params.id)
      .populate('reviewedBy', 'email')
      .lean();

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found'
      });
    }

    // Remove sensitive information
    delete verification.ipAddress;
    delete verification.userAgent;

    res.status(200).json({
      success: true,
      data: verification
    });

  } catch (error) {
    logger.error('Get verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification'
    });
  }
};

// @desc    Get all verifications with data isolation
// @route   GET /api/document/verifications
// @access  Private (Admin)
const getAllVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, q } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query with data isolation
    const query = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    // Data isolation: Only SuperAdmins can see all data, regular admins see only their created data
    if (req.admin.role !== 'superadmin') {
      query.createdBy = req.admin.id;
    }

    // Add search functionality
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { idNumber: { $regex: q, $options: 'i' } },
        { jobTitle: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } }
      ];
    }

    const verifications = await DocumentVerification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviewedBy', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    const total = await DocumentVerification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: verifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Get all verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verifications'
    });
  }
};

// @desc    Update verification status (Admin) with data isolation
// @route   PUT /api/document/verify/:id
// @access  Private (Admin)
const updateVerificationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: approved, rejected, or pending'
      });
    }

    // Build query with data isolation
    const query = { _id: req.params.id };
    
    // Data isolation: Only SuperAdmins can update any verification, regular admins can only update their own
    if (req.admin.role !== 'superadmin') {
      query.createdBy = req.admin.id;
    }

    const verification = await DocumentVerification.findOne(query);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found or you do not have permission to update it'
      });
    }

    // Update verification
    verification.status = status;
    verification.reviewedBy = req.admin.id;
    verification.reviewedAt = new Date();
    if (notes) verification.notes = notes;

    await verification.save();

    // Create audit log
    await Log.createLog(req.admin.id, 'update', 'DocumentVerification', verification._id, {
      email: verification.email,
      oldStatus: verification.status,
      newStatus: status,
      notes,
      reviewedBy: req.admin.email
    }, req);

    logger.info(`Verification ${verification._id} status updated to ${status} by ${req.admin.email}`);

    res.status(200).json({
      success: true,
      message: 'Verification status updated successfully',
      data: verification
    });

  } catch (error) {
    logger.error('Update verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update verification status'
    });
  }
};

// @desc    Delete verification record with data isolation (Admin)
// @route   DELETE /api/document/verify/:id
// @access  Private (Admin)
const deleteVerification = async (req, res) => {
  try {
    // Build query with data isolation
    const query = { _id: req.params.id };
    
    // Data isolation: Only SuperAdmins can delete any verification, regular admins can only delete their own
    if (req.admin.role !== 'superadmin') {
      query.createdBy = req.admin.id;
    }

    const verification = await DocumentVerification.findOne(query);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found or you do not have permission to delete it'
      });
    }

    // Delete document file
    try {
      await deleteFile(verification.documentUrl);
    } catch (fileError) {
      logger.warn(`Failed to delete file ${verification.documentUrl}:`, fileError);
    }

    // Delete verification record
    await verification.deleteOne();

    // Create audit log
    await Log.createLog(req.admin.id, 'delete', 'DocumentVerification', verification._id, {
      email: verification.email,
      name: verification.name,
      deletedBy: req.admin.email
    }, req);

    logger.info(`Verification ${verification._id} deleted by ${req.admin.email}`);

    res.status(200).json({
      success: true,
      message: 'Verification deleted successfully'
    });

  } catch (error) {
    logger.error('Delete verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete verification'
    });
  }
};

// @desc    Get verification statistics with data isolation (Admin)
// @route   GET /api/document/stats
// @access  Private (Admin)
const getVerificationStats = async (req, res) => {
  try {
    // Build query with data isolation
    const query = {};
    
    // Data isolation: Only SuperAdmins can see all stats, regular admins see only their own data
    if (req.admin.role !== 'superadmin') {
      query.createdBy = req.admin.id;
    }

    // Get stats with data isolation
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
    
    // Get recent activity with data isolation
    const recentVerifications = await DocumentVerification.find(query)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email status createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        stats: result,
        recent: recentVerifications
      }
    });

  } catch (error) {
    logger.error('Get verification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification statistics'
    });
  }
};

// Helper function to detect document type from filename
const detectDocumentType = (filename) => {
  const name = filename.toLowerCase();
  if (name.includes('passport')) return 'passport';
  if (name.includes('license') || name.includes('driving')) return 'driver_license';
  if (name.includes('national') || name.includes('id')) return 'national_id';
  return 'other';
};

// Multer error handler
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  if (err.message.includes('File type') || err.message.includes('not allowed')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// @desc    Update employment status
// @route   PATCH /api/document/:id/employment-status
// @access  Private (Admin)
const updateEmploymentStatus = async (req, res) => {
  try {
    const { employmentStatus, endDate } = req.body;

    if (!employmentStatus || !['active', 'former'].includes(employmentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Valid employment status (active/former) is required'
      });
    }

    const verification = await DocumentVerification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found'
      });
    }

    // Update employment status
    await verification.updateEmploymentStatus(employmentStatus, endDate);

    // Create audit log
    await Log.createLog(req.admin.id, 'update', 'DocumentVerification', verification._id, {
      employmentStatusChange: {
        from: employmentStatus === 'active' ? 'former' : 'active',
        to: employmentStatus,
        endDate: verification.endDate
      },
      updatedBy: req.admin.email
    }, req);

    logger.info(`Employment status updated: ${verification._id} to ${employmentStatus} by ${req.admin.email}`);

    res.status(200).json({
      success: true,
      message: `Employment status updated to ${employmentStatus}`,
      data: verification
    });

  } catch (error) {
    logger.error('Update employment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employment status'
    });
  }
};

module.exports = {
  upload,
  uploadDocument,
  getVerification,
  getAllVerifications,
  updateVerificationStatus,
  updateEmploymentStatus,
  deleteVerification,
  getVerificationStats,
  handleMulterError
};