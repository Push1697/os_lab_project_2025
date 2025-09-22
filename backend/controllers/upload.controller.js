const multer = require('multer');
const path = require('path');
const { uploadFile, deleteFile, isS3Configured } = require('../config/aws');
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

// Configure multer for memory storage (files will be handled by S3 or local storage)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
  }
});

// @desc    Upload certificate file
// @route   POST /api/upload/certificate
// @access  Private (Admin)
const uploadCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Upload file to S3 or local storage
    const fileUrl = await uploadFile(req.file, 'certificates');

    // Create audit log
    await Log.createLog(req.admin.id, 'upload', 'Certificate', null, {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      url: fileUrl,
      storageType: isS3Configured() ? 'S3' : 'local'
    }, req);

    logger.info(`File uploaded by admin ${req.admin.email}: ${req.file.originalname}`);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      fileName: req.file.originalname,
      size: req.file.size
    });

  } catch (error) {
    logger.error('Upload certificate error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
};

// @desc    Delete certificate file
// @route   DELETE /api/upload/certificate
// @access  Private (Admin)
const deleteCertificate = async (req, res) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }

    // Delete file from S3 or local storage
    await deleteFile(fileUrl);

    // Create audit log
    await Log.createLog(req.admin.id, 'delete', 'Certificate', null, {
      fileUrl,
      deletedAt: new Date()
    }, req);

    logger.info(`File deleted by admin ${req.admin.email}: ${fileUrl}`);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    logger.error('Delete certificate error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete file'
    });
  }
};

// Multer error handler
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${Math.floor((parseInt(process.env.MAX_FILE_SIZE) || 5242880) / 1024 / 1024)}MB`
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

module.exports = {
  upload,
  uploadCertificate,
  deleteCertificate,
  handleMulterError
};