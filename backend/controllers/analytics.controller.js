const User = require('../models/User');
const DocumentVerification = require('../models/DocumentVerification');
const Admin = require('../models/Admin');
const Log = require('../models/Log');

// Helper function to get date range
const getDateRange = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate: now };
};

// Get dashboard overview statistics
const getDashboardStats = async (req, res) => {
  try {
    const currentAdmin = req.admin; // Get current admin from auth middleware
    
    // Build filter based on admin role
    let verificationFilter = {};
    let userFilter = { active: true };
    
    // If not superadmin, only show data created by this admin
    if (currentAdmin.role !== 'superadmin') {
      verificationFilter.createdBy = currentAdmin._id;
      // For users, we might want to show all users if they're admin-managed
      // or filter by who added them if that field exists
    }

    // Get basic counts with role filtering
    const totalUsers = await User.countDocuments(userFilter);
    const totalVerifications = await DocumentVerification.countDocuments(verificationFilter);
    const totalAdmins = currentAdmin.role === 'superadmin' 
      ? await Admin.countDocuments({ active: true })
      : 1; // Regular admins can only see themselves

    // Get verification status counts with filtering
    const verificationStats = await DocumentVerification.aggregate([
      { $match: verificationFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: totalVerifications
    };

    verificationStats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    // Get today's activity with filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayUsers = await User.countDocuments({
      ...userFilter,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayVerifications = await DocumentVerification.countDocuments({
      ...verificationFilter,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Calculate growth percentages (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const currentMonthUsers = await User.countDocuments({
      ...userFilter,
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    const previousMonthUsers = await User.countDocuments({
      ...userFilter,
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });

    const userGrowthPercent = previousMonthUsers > 0 
      ? Math.round(((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100) 
      : 100;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalVerifications,
          totalAdmins,
          todayUsers,
          todayVerifications,
          userGrowthPercent
        },
        verifications: statusCounts,
        activity: {
          today: {
            users: todayUsers,
            verifications: todayVerifications
          }
        },
        adminRole: currentAdmin.role,
        adminId: currentAdmin._id
      }
    });

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// Get user growth data for charts
const getUserGrowthData = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const currentAdmin = req.admin;
    const { startDate, endDate } = getDateRange(period);

    // Build filter based on admin role
    let userFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // If not superadmin, only show users they are responsible for
    // Note: This assumes users have a createdBy field or similar
    // If users don't have this field, all admins will see all users for now
    if (currentAdmin.role !== 'superadmin') {
      // You might want to add a createdBy field to User model
      // For now, showing all users but you can modify this logic
      // userFilter.createdBy = currentAdmin._id;
    }

    const userData = await User.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Format data for chart
    const chartData = userData.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      users: item.count
    }));

    // Fill in missing days with 0 users
    const filledData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = chartData.find(d => d.date === dateStr);
      
      filledData.push({
        date: dateStr,
        users: existingData ? existingData.users : 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: {
        period,
        growth: filledData,
        total: filledData.reduce((sum, day) => sum + day.users, 0),
        adminRole: currentAdmin.role
      }
    });

  } catch (error) {
    console.error('Error getting user growth data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user growth data'
    });
  }
};

// Get verification trends data
const getVerificationTrends = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const currentAdmin = req.admin;
    const { startDate, endDate } = getDateRange(period);

    // Build filter based on admin role
    let verificationFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // If not superadmin, only show verifications created by this admin
    if (currentAdmin.role !== 'superadmin') {
      verificationFilter.createdBy = currentAdmin._id;
    }

    const verificationData = await DocumentVerification.aggregate([
      { $match: verificationFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Group by date and organize by status
    const dateMap = {};
    
    verificationData.forEach(item => {
      const date = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      
      if (!dateMap[date]) {
        dateMap[date] = { date, pending: 0, approved: 0, rejected: 0, total: 0 };
      }
      
      dateMap[date][item._id.status] = item.count;
      dateMap[date].total += item.count;
    });

    const chartData = Object.values(dateMap);

    res.json({
      success: true,
      data: {
        period,
        trends: chartData,
        summary: {
          total: chartData.reduce((sum, day) => sum + day.total, 0),
          approved: chartData.reduce((sum, day) => sum + day.approved, 0),
          pending: chartData.reduce((sum, day) => sum + day.pending, 0),
          rejected: chartData.reduce((sum, day) => sum + day.rejected, 0)
        },
        adminRole: currentAdmin.role
      }
    });

  } catch (error) {
    console.error('Error getting verification trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification trends'
    });
  }
};

// Get system activity data
const getSystemActivity = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const currentAdmin = req.admin;
    const { startDate, endDate } = getDateRange(period);

    // Get hourly activity for the past 24 hours with data isolation
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Build filter based on admin role
    let hourlyActivityFilter = {
      createdAt: { $gte: twentyFourHoursAgo }
    };

    // If not superadmin, only show data created by this admin
    if (currentAdmin.role !== 'superadmin') {
      hourlyActivityFilter.createdBy = currentAdmin._id;
    }

    const hourlyActivity = await DocumentVerification.aggregate([
      {
        $match: hourlyActivityFilter
      },
      {
        $group: {
          _id: { 
            hour: { $hour: '$createdAt' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          verifications: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1, '_id.hour': 1 }
      }
    ]);

    // Get recent activity by admin with filtering
    let adminActivityFilter = {
      reviewedAt: { $gte: startDate, $lte: endDate },
      reviewedBy: { $exists: true }
    };

    // If not superadmin, only show their own activity
    if (currentAdmin.role !== 'superadmin') {
      adminActivityFilter.createdBy = currentAdmin._id;
    }

    const adminActivity = await DocumentVerification.aggregate([
      {
        $match: adminActivityFilter
      },
      {
        $lookup: {
          from: 'admins',
          localField: 'reviewedBy',
          foreignField: '_id',
          as: 'admin'
        }
      },
      {
        $unwind: '$admin'
      },
      {
        $group: {
          _id: '$reviewedBy',
          adminEmail: { $first: '$admin.email' },
          actions: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { actions: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        hourlyActivity,
        adminActivity,
        adminRole: currentAdmin.role
      }
    });

  } catch (error) {
    console.error('Error getting system activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system activity'
    });
  }
};

// Get performance metrics
const getPerformanceMetrics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const currentAdmin = req.admin;
    const { startDate, endDate } = getDateRange(period);

    // Build filter based on admin role
    let performanceFilter = {
      status: { $in: ['approved', 'rejected'] },
      reviewedAt: { $gte: startDate, $lte: endDate }
    };

    // If not superadmin, only show data created by this admin
    if (currentAdmin.role !== 'superadmin') {
      performanceFilter.createdBy = currentAdmin._id;
    }

    // Average processing time for verifications
    const processingTimes = await DocumentVerification.aggregate([
      {
        $match: performanceFilter
      },
      {
        $addFields: {
          processingTimeHours: {
            $divide: [
              { $subtract: ['$reviewedAt', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgProcessingTime: { $avg: '$processingTimeHours' },
          minProcessingTime: { $min: '$processingTimeHours' },
          maxProcessingTime: { $max: '$processingTimeHours' },
          totalProcessed: { $sum: 1 }
        }
      }
    ]);

    // Success rate with filtering
    let successRateFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // If not superadmin, only show data created by this admin
    if (currentAdmin.role !== 'superadmin') {
      successRateFilter.createdBy = currentAdmin._id;
    }

    const successRate = await DocumentVerification.aggregate([
      {
        $match: successRateFilter
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const metrics = processingTimes[0] || {
      avgProcessingTime: 0,
      minProcessingTime: 0,
      maxProcessingTime: 0,
      totalProcessed: 0
    };

    const statusCounts = { approved: 0, rejected: 0, pending: 0 };
    successRate.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    const total = statusCounts.approved + statusCounts.rejected + statusCounts.pending;
    const successPercent = total > 0 ? Math.round((statusCounts.approved / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        period,
        processing: {
          averageTime: Math.round(metrics.avgProcessingTime * 100) / 100,
          minTime: Math.round(metrics.minProcessingTime * 100) / 100,
          maxTime: Math.round(metrics.maxProcessingTime * 100) / 100,
          totalProcessed: metrics.totalProcessed
        },
        success: {
          rate: successPercent,
          approved: statusCounts.approved,
          rejected: statusCounts.rejected,
          pending: statusCounts.pending,
          total
        },
        adminRole: currentAdmin.role
      }
    });

  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance metrics'
    });
  }
};

// Get calendar events data
const getCalendarEvents = async (req, res) => {
  try {
    const { start, end } = req.query;
    const currentAdmin = req.admin;
    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Build filters based on admin role
    let verificationFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };
    let userFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // If not superadmin, only show data created by this admin
    if (currentAdmin.role !== 'superadmin') {
      verificationFilter.createdBy = currentAdmin._id;
      // For users, you might want to add createdBy field or similar logic
      // userFilter.createdBy = currentAdmin._id;
    }

    // Get verification events with filtering
    const verifications = await DocumentVerification.find(verificationFilter)
      .select('createdAt status user.name user.email')
      .lean();

    // Get user registration events with filtering
    const users = await User.find(userFilter)
      .select('createdAt name email')
      .lean();

    // Format events for calendar
    const events = [
      ...verifications.map(v => ({
        id: v._id,
        title: `Verification: ${v.user?.name || 'Unknown'}`,
        date: v.createdAt.toISOString().split('T')[0],
        type: 'verification',
        status: v.status,
        color: v.status === 'approved' ? '#10b981' : v.status === 'rejected' ? '#ef4444' : '#f59e0b'
      })),
      ...users.map(u => ({
        id: u._id,
        title: `New User: ${u.name}`,
        date: u.createdAt.toISOString().split('T')[0],
        type: 'user',
        color: '#3b82f6'
      }))
    ];

    res.json({
      success: true,
      data: {
        events: events.sort((a, b) => new Date(b.date) - new Date(a.date)),
        summary: {
          totalEvents: events.length,
          verifications: verifications.length,
          newUsers: users.length
        },
        adminRole: currentAdmin.role
      }
    });

  } catch (error) {
    console.error('Error getting calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar events'
    });
  }
};

module.exports = {
  getDashboardStats,
  getUserGrowthData,
  getVerificationTrends,
  getSystemActivity,
  getPerformanceMetrics,
  getCalendarEvents
};