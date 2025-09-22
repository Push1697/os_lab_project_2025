const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Initialize AWS S3 configuration
const { initS3 } = require('./config/aws');
initS3();

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const verifyRoutes = require('./routes/verify');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admins');
const documentRoutes = require('./routes/document');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:5173'];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (for local file storage)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Trust proxy for rate limiting (important for production)
app.set('trust proxy', 1);

// Database connection
const connectDB = require('./config/db');
connectDB();

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'ID Verification API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log('Unhandled Rejection:', err.message);
    // Close server & exit process
    server.close(() => {
      process.exit(1);
    });
  });
}

module.exports = app;