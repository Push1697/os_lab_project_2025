const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15min";

// ✅ Admin ke liye token generate karne ka function
const generateAdminToken = (adminId, email, role) => {
  const payload = {
    id: adminId,
    email: email,
    role: role,
    type: 'admin'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// ✅ User ke liye token generate karne ka function
const generateUserToken = (userId, email) => {
  const payload = {
    id: userId,
    email: email,
    type: 'user'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// ✅ General token generate karne ka function
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// ✅ Token verify karne ka function
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// ✅ Token verify karne ka enhanced function with error details
const verifyTokenWithDetails = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      success: true,
      data: decoded,
      error: null
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: {
        name: err.name,
        message: err.message,
        expired: err.name === 'TokenExpiredError'
      }
    };
  }
};

// ✅ Token decode karne ka function (without verification)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (err) {
    return null;
  }
};

module.exports = { 
  generateToken, 
  generateAdminToken, 
  generateUserToken, 
  verifyToken, 
  verifyTokenWithDetails,
  decodeToken 
};
