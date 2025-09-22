const User = require('../models/User');
const DocumentVerification = require('../models/DocumentVerification');
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

// @desc    Verify certificate by ID
// @route   GET /api/verify/:certificateId
// @access  Public (rate limited)
const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    // Log verification attempt
    logger.info(`Certificate verification attempt for ID: ${certificateId}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Find user by certificate ID (excluding soft deleted)
    const user = await User.findOne({ 
      certificateId: certificateId,
      deletedAt: null
    }).select('certificateId name email company position fromDate toDate certificateUrl extra');

    if (!user) {
      logger.info(`Certificate not found: ${certificateId}`);
      return res.status(200).json({
        success: true,
        verified: false
      });
    }

    logger.info(`Certificate verified successfully: ${certificateId}`);
    
    res.status(200).json({
      success: true,
      verified: true,
      user: {
        certificateId: user.certificateId,
        name: user.name,
        email: user.email,
        company: user.company,
        position: user.position,
        fromDate: user.fromDate,
        toDate: user.toDate,
        certificateUrl: user.certificateUrl,
        extra: user.extra
      }
    });

  } catch (error) {
    logger.error('Certificate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
};

// @desc    Verify ID document by ID number
// @route   GET /api/verify/id/:idNumber
// @access  Public (rate limited)
const verifyIdDocument = async (req, res) => {
  try {
    const { idNumber } = req.params;

    // Log verification attempt
    logger.info(`ID document verification attempt for ID: ${idNumber}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Find verification record by ID number and approved status
    const verification = await DocumentVerification.findOne({ 
      idNumber: idNumber,
      status: 'approved'
    }).select('idNumber name email phone documentType status reviewedAt submittedAt');

    if (!verification) {
      logger.info(`ID document not found or not verified: ${idNumber}`);
      return res.status(200).json({
        success: true,
        verified: false,
        message: 'ID number not found or verification pending'
      });
    }

    logger.info(`ID document verified successfully: ${idNumber}`);
    
    res.status(200).json({
      success: true,
      verified: true,
      data: {
        idNumber: verification.idNumber,
        name: verification.name,
        email: verification.email,
        phone: verification.phone,
        documentType: verification.documentType,
        verifiedAt: verification.reviewedAt,
        submittedAt: verification.submittedAt,
        status: verification.status
      }
    });

  } catch (error) {
    logger.error('ID document verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
};

// @desc    Get verification status by ID number
// @route   GET /api/verify/status/:idNumber  
// @access  Public
const getVerificationStatus = async (req, res) => {
  try {
    const { idNumber } = req.params;

    // Find verification record by ID number
    const verification = await DocumentVerification.findOne({ 
      idNumber: idNumber
    }).select('idNumber name status reviewedAt submittedAt notes');

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'No verification record found for this ID number'
      });
    }

    const statusInfo = {
      idNumber: verification.idNumber,
      name: verification.name,
      status: verification.status,
      submittedAt: verification.submittedAt,
      reviewedAt: verification.reviewedAt || null
    };

    // Add status-specific messages
    switch (verification.status) {
      case 'pending':
        statusInfo.message = 'Your verification is under review. Please check back later.';
        break;
      case 'approved':
        statusInfo.message = 'Your ID has been successfully verified.';
        break;
      case 'rejected':
        statusInfo.message = 'Your verification was not approved. Please contact support if you have questions.';
        statusInfo.notes = verification.notes;
        break;
    }

    res.status(200).json({
      success: true,
      data: statusInfo
    });

  } catch (error) {
    logger.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking status'
    });
  }
};

module.exports = {
  verifyCertificate,
  verifyIdDocument,
  getVerificationStatus
};