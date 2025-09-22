const { verifyTokenWithDetails, generateAdminToken } = require('../utils/jwt');
const Admin = require('../models/Admin');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided, access denied' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token using enhanced verification
    const verification = verifyTokenWithDetails(token);
    
    if (!verification.success) {
      if (verification.error.expired) {
        return res.status(401).json({ 
          success: false,
          message: 'Token expired' 
        });
      }
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }

    const decoded = verification.data;

    // Find admin user
    const admin = await Admin.findById(decoded.id).select('-passwordHash');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Admin not found or inactive' 
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(401).json({ 
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts' 
      });
    }

    // Add admin info to request object
    req.admin = {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Authentication failed' 
    });
  }
};

// Middleware to check if admin role
const requireAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  
  if (req.admin.role !== 'admin' && req.admin.role !== 'superadmin') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
  
  next();
};

// Middleware to check if superadmin role
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ 
      success: false,
      message: 'Super admin access required' 
    });
  }
  
  next();
};

// Generate JWT token (using enhanced utility function)
const generateToken = (adminId, email, role) => {
  return generateAdminToken(adminId, email, role);
};

module.exports = {
  authMiddleware,
  requireAdmin,
  requireSuperAdmin,
  generateToken
};