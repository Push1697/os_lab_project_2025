const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'upload', 'restore', 'login', 'logout']
  },
  targetType: {
    type: String,
    required: true,
    enum: ['User', 'Admin', 'Certificate']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
logSchema.index({ admin: 1, createdAt: -1 });
logSchema.index({ targetType: 1, targetId: 1 });
logSchema.index({ action: 1 });
logSchema.index({ createdAt: -1 });

// Static method to create log entry
logSchema.statics.createLog = function(adminId, action, targetType, targetId, details = {}, req = null) {
  const logData = {
    admin: adminId,
    action,
    targetType,
    targetId,
    details
  };

  if (req) {
    logData.ipAddress = req.ip || req.connection.remoteAddress;
    logData.userAgent = req.get('User-Agent');
  }

  return this.create(logData);
};

module.exports = mongoose.model('Log', logSchema);