const mongoose = require('mongoose');
const validator = require('validator');

const documentVerificationSchema = new mongoose.Schema({
  // User Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[\+]?[0-9\s\-\(\)]{10,15}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  idNumber: {
    type: String,
    required: [true, 'ID number is required'],
    trim: true,
    maxlength: [50, 'ID number cannot exceed 50 characters'],
    index: true
  },
  
  // Employment Information (Optional for backwards compatibility)
  jobTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date,
    default: null
  },
  employmentStatus: {
    type: String,
    enum: ['active', 'former'],
    default: 'active'
  },
  
  // Document Information
  documentUrl: {
    type: String,
    required: [true, 'Document URL is required'],
    trim: true
  },
  documentType: {
    type: String,
    enum: ['passport', 'driver_license', 'national_id', 'other'],
    default: 'other'
  },
  documentSize: {
    type: Number,
    max: [10 * 1024 * 1024, 'Document size cannot exceed 10MB'] // 10MB
  },
  documentMimeType: {
    type: String,
    enum: ['image/jpeg', 'image/png', 'application/pdf'],
    required: true
  },
  
  // Verification Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  
  // Review Information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  reviewedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Data isolation - which admin created this verification
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Additional Information
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  
  // Audit Fields
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
documentVerificationSchema.index({ email: 1 });
documentVerificationSchema.index({ status: 1 });
documentVerificationSchema.index({ createdAt: -1 });
documentVerificationSchema.index({ reviewedAt: -1 });

// Text search index
documentVerificationSchema.index({
  name: 'text',
  email: 'text',
  idNumber: 'text',
  notes: 'text'
});

// Virtual for checking if verification is completed
documentVerificationSchema.virtual('isCompleted').get(function() {
  return this.status !== 'pending';
});

// Virtual for verification age in hours
documentVerificationSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Method to approve verification
documentVerificationSchema.methods.approve = function(adminId, notes) {
  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

// Method to reject verification
documentVerificationSchema.methods.reject = function(adminId, notes) {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

// Method to reset to pending
documentVerificationSchema.methods.resetToPending = function() {
  this.status = 'pending';
  this.reviewedBy = null;
  this.reviewedAt = null;
  this.notes = '';
  return this.save();
};

// Method to update employment status
documentVerificationSchema.methods.updateEmploymentStatus = function(newStatus, endDate) {
  this.employmentStatus = newStatus;
  if (newStatus === 'former' && !this.endDate) {
    this.endDate = endDate || new Date();
  } else if (newStatus === 'active') {
    this.endDate = null;
  }
  return this.save();
};

// Remove sensitive data from JSON output
documentVerificationSchema.methods.toJSON = function() {
  const verificationObject = this.toObject();
  delete verificationObject.ipAddress;
  delete verificationObject.userAgent;
  return verificationObject;
};

// Static method to get statistics
documentVerificationSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
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
  
  return result;
};

module.exports = mongoose.model('DocumentVerification', documentVerificationSchema);