const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: [true, 'Certificate ID is required'],
    unique: true,
    trim: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9\-_]+$/.test(v);
      },
      message: 'Certificate ID can only contain alphanumeric characters, hyphens, and underscores'
    }
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || validator.isEmail(v);
      },
      message: 'Please provide a valid email'
    }
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  fromDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !this.toDate || !v || v <= this.toDate;
      },
      message: 'From date must be before or equal to to date'
    }
  },
  toDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !this.fromDate || !v || v >= this.fromDate;
      },
      message: 'To date must be after or equal to from date'
    }
  },
  certificateUrl: {
    type: String,
    trim: true
  },
  extra: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Text search indexes for search functionality
userSchema.index({
  certificateId: 'text',
  name: 'text',
  email: 'text',
  company: 'text'
});

// Compound indexes for efficient queries
userSchema.index({ createdAt: -1 });
userSchema.index({ deletedAt: 1 });

// Virtual for full name display
userSchema.virtual('isDeleted').get(function() {
  return !!this.deletedAt;
});

// Method to soft delete
userSchema.methods.softDelete = function(adminId) {
  this.deletedAt = new Date();
  this.deletedBy = adminId;
  return this.save();
};

// Method to restore from soft delete
userSchema.methods.restore = function() {
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

// Exclude deleted users by default
userSchema.pre(/^find/, function() {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

module.exports = mongoose.model('User', userSchema);