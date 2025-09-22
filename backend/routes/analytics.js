const express = require('express');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const {
  getDashboardStats,
  getUserGrowthData,
  getVerificationTrends,
  getSystemActivity,
  getPerformanceMetrics,
  getCalendarEvents
} = require('../controllers/analytics.controller');

const router = express.Router();

// All analytics routes require admin authentication
router.use(authMiddleware);
router.use(requireAdmin);

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard overview statistics
// @access  Private (Admin)
router.get('/dashboard', getDashboardStats);

// @route   GET /api/analytics/user-growth
// @desc    Get user growth data for charts
// @access  Private (Admin)
router.get('/user-growth', getUserGrowthData);

// @route   GET /api/analytics/verification-trends
// @desc    Get verification trends data
// @access  Private (Admin)
router.get('/verification-trends', getVerificationTrends);

// @route   GET /api/analytics/system-activity
// @desc    Get system activity data
// @access  Private (Admin)
router.get('/system-activity', getSystemActivity);

// @route   GET /api/analytics/performance
// @desc    Get performance metrics
// @access  Private (Admin)
router.get('/performance', getPerformanceMetrics);

// @route   GET /api/analytics/calendar-events
// @desc    Get calendar events data
// @access  Private (Admin)
router.get('/calendar-events', getCalendarEvents);

module.exports = router;