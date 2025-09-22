import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verificationAPI, userAPI, adminAPI, authAPI, analyticsAPI, removeAuthToken } from '../api/api';
import {
  UserGrowthChart,
  VerificationTrendsChart,
  StatusDistributionChart,
  SystemActivityChart,
  PerformanceChart
} from '../components/Charts';
import CalendarComponent from '../components/Calendar';
import AdminNavbar from '../components/AdminNavbar';
import { ToastContainer, useToast } from '../components/Toast';

interface Verification {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  idNumber?: string;
  jobTitle?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  employmentStatus?: 'active' | 'former';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  idNumber?: string;
  verificationStatus: string;
  createdAt: string;
  jobTitle?: string;
  department?: string;
  employmentStatus?: 'active' | 'former';
  endDate?: string;
}

interface Admin {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  createdBy?: {
    _id: string;
    name?: string;
    email: string;
  };
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'verifications' | 'users' | 'admins' | 'adddata' | 'analytics' | 'calendar' | 'settings'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024); // Only open by default on desktop
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(3);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Review pending verifications', completed: false },
    { id: 2, text: 'Update user analytics', completed: true },
    { id: 3, text: 'Check system performance', completed: false },
  ]);
  const [newTask, setNewTask] = useState('');
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalVerifications: 0,
    pendingVerifications: 0,
    approvedVerifications: 0,
    rejectedVerifications: 0,
    totalUsers: 0,
  });
  const [authChecked, setAuthChecked] = useState(false);
  
  // Analytics state
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [userGrowthData, setUserGrowthData] = useState<any>(null);
  const [verificationTrendsData, setVerificationTrendsData] = useState<any>(null);
  const [systemActivityData, setSystemActivityData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  // Add Data functionality states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [addDataForm, setAddDataForm] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    jobTitle: '',
    department: '',
    startDate: ''
  });

  // Toast notifications
  const { toasts, removeToast, showSuccess, showError} = useToast();

  useEffect(() => {
    checkAuthAndLoadData();
  }, [activeTab, currentPage, navigate]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Close notification dropdown if clicking outside
      if (showNotificationDropdown && !target.closest('[data-notification-dropdown]') && !target.closest('[data-notification-button]')) {
        setShowNotificationDropdown(false);
      }
      
      // Close profile dropdown if clicking outside
      if (showProfileDropdown && !target.closest('[data-profile-dropdown]') && !target.closest('[data-profile-button]')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationDropdown, showProfileDropdown]);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    // Apply dark mode class to document body
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle initial tab from navigation state
  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && (activeTab === 'dashboard' || activeTab === 'analytics')) {
      const intervalId = setInterval(async () => {
        try {
          await loadStats();
          if (activeTab === 'dashboard' || activeTab === 'analytics') {
            await loadAnalyticsData(analyticsPeriod);
          }
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }, 30000); // Refresh every 30 seconds

      setRefreshInterval(intervalId as any);

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [autoRefresh, activeTab, analyticsPeriod]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Reload data when search query changes
  useEffect(() => {
    if (searchQuery !== undefined) { // Only trigger after initial render
      setCurrentPage(1); // Reset to first page when searching
      loadData();
    }
  }, [searchQuery, activeTab]);

  // Reload data when page changes
  useEffect(() => {
    loadData();
  }, [currentPage]);

  const checkAuthAndLoadData = async () => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    console.log('Auth token found:', !!token); // Debug log
    
    if (!token) {
      console.log('No token found, redirecting to login'); // Debug log
      navigate('/admin/login', { replace: true });
      return;
    }
    
    setAuthChecked(true);
    
    try {
      await loadCurrentUser();
      await loadStats();
      await loadData();
      
      // Load analytics data for dashboard and analytics tabs
      if (activeTab === 'dashboard' || activeTab === 'analytics') {
        await loadAnalyticsData(analyticsPeriod);
      }
    } catch (error) {
      console.error('Error during data loading:', error);
      // If any critical data loading fails due to auth, redirect to login
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('unauthorized'))) {
        console.log('Authentication failed, redirecting to login');
        removeAuthToken();
        navigate('/admin/login', { replace: true });
      }
    }
  };

  const loadCurrentUser = async () => {
    try {
      console.log('Loading current user profile'); // Debug log
      const response = await authAPI.getProfile();
      console.log('Profile loaded:', response); // Debug log
      setCurrentUser(response.admin);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // If profile loading fails, redirect to login
      removeAuthToken();
      navigate('/admin/login', { replace: true });
    }
  };

  const loadStats = async () => {
    try {
      // Load enhanced dashboard stats from analytics API
      const dashboardResponse = await analyticsAPI.getDashboardStats();
      
      if (dashboardResponse.success) {
        const data = dashboardResponse.data;
        
        // Set the main stats display
        setStats({
          totalVerifications: data.overview.totalVerifications,
          pendingVerifications: data.verifications.pending,
          approvedVerifications: data.verifications.approved,
          rejectedVerifications: data.verifications.rejected,
          totalUsers: data.overview.totalUsers,
        });
        
        // Set enhanced dashboard stats
        setDashboardStats(data);
      } else {
        // Fallback to original method if analytics API fails
        const statsResponse = await verificationAPI.getVerificationStats();
        const userResponse = await userAPI.getAllUsers(1, 1000);
        
        const statsData = statsResponse.data?.stats || {};
        
        setStats({
          totalVerifications: statsData.total || 0,
          pendingVerifications: statsData.pending || 0,
          approvedVerifications: statsData.approved || 0,
          rejectedVerifications: statsData.rejected || 0,
          totalUsers: userResponse.data?.length || userResponse.pagination?.total || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Fallback: try to calculate from verifications if stats endpoint fails
      try {
        const verifyResponse = await verificationAPI.getAllVerifications(1, 1000);
        const userResponse = await userAPI.getAllUsers(1, 1000);
        
        const verificationData = verifyResponse.data || [];
        
        setStats({
          totalVerifications: verificationData.length,
          pendingVerifications: verificationData.filter((v: Verification) => v.status === 'pending').length,
          approvedVerifications: verificationData.filter((v: Verification) => v.status === 'approved').length,
          rejectedVerifications: verificationData.filter((v: Verification) => v.status === 'rejected').length,
          totalUsers: userResponse.data?.length || userResponse.pagination?.total || 0,
        });
      } catch (fallbackError) {
        console.error('Failed to load stats with fallback:', fallbackError);
      }
    }
  };

  // Load analytics data
  const loadAnalyticsData = async (period: string = '30d') => {
    setAnalyticsLoading(true);
    
    try {
      const [growthResponse, trendsResponse, activityResponse, performanceResponse] = await Promise.all([
        analyticsAPI.getUserGrowthData(period),
        analyticsAPI.getVerificationTrends(period),
        analyticsAPI.getSystemActivity('7d'), // Always use 7d for activity
        analyticsAPI.getPerformanceMetrics(period)
      ]);

      if (growthResponse.success) {
        setUserGrowthData(growthResponse.data.growth);
      }
      
      if (trendsResponse.success) {
        setVerificationTrendsData(trendsResponse.data.trends);
      }
      
      if (activityResponse.success) {
        setSystemActivityData(activityResponse.data.hourlyActivity);
      }
      
      if (performanceResponse.success) {
        setPerformanceData(performanceResponse.data);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Handle analytics period change
  const handleAnalyticsPeriodChange = async (newPeriod: string) => {
    setAnalyticsPeriod(newPeriod);
    await loadAnalyticsData(newPeriod);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'verifications') {
        console.log('Loading verifications...'); // Debug log
        const response = await verificationAPI.getAllVerifications(currentPage, 10, searchQuery);
        console.log('Verifications response:', response); // Debug log
        setVerifications(response.data || []);
        setTotalPages(response.pagination?.pages || 1);
      } else if (activeTab === 'users') {
        console.log('Loading users...'); // Debug log
        const response = await userAPI.getAllUsers(currentPage, 10, searchQuery);
        console.log('Users response:', response); // Debug log
        setUsers(response.data || []);
        setTotalPages(response.pagination?.pages || 1);
      } else if (activeTab === 'admins') {
        console.log('Loading admins...'); // Debug log
        const response = await adminAPI.getAllAdmins(currentPage, 10);
        console.log('Admins response:', response); // Debug log
        setAdmins(response.data || []);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Failed to load data for tab:', activeTab, error);
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('401')) {
        console.log('Authentication error, redirecting to login');
        removeAuthToken();
        navigate('/admin/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationStatusChange = async (verificationId: string, status: string) => {
    try {
      const response = await verificationAPI.updateVerificationStatus(verificationId, status);
      
      if (response.success) {
        // Show success toast
        showSuccess(
          'Status Updated Successfully!',
          `Verification has been ${status === 'approved' ? 'approved' : 'rejected'} successfully.`,
          4000
        );
        
        // Reload data to reflect changes
        await loadData();
        await loadStats();
      } else {
        showError(
          'Update Failed',
          response.message || 'Failed to update verification status. Please try again.',
          5000
        );
      }
    } catch (error: any) {
      console.error('Error updating verification status:', error);
      
      // Show appropriate error message based on error type
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        showError(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          5000
        );
        removeAuthToken();
        navigate('/admin/login', { replace: true });
      } else if (error.message?.includes('403') || error.message?.includes('forbidden')) {
        showError(
          'Permission Denied',
          'You do not have permission to update this verification.',
          5000
        );
      } else if (error.message?.includes('404')) {
        showError(
          'Verification Not Found',
          'The verification record could not be found or has been deleted.',
          5000
        );
      } else {
        showError(
          'Update Failed',
          error.message || 'Failed to update verification status. Please try again.',
          5000
        );
      }
    }
  };

  const handleUserDeactivation = async (userId: string) => {
    try {
      // Set current date as end date
      const currentDate = new Date().toISOString();
      const response = await verificationAPI.updateEmploymentStatus(userId, 'former', currentDate);
      
      if (response.success) {
        showSuccess(
          'User Deactivated!',
          'Employee has been marked as former and end date has been set.',
          4000
        );
        
        // Reload data to reflect changes
        await loadData();
        await loadStats();
      } else {
        showError(
          'Deactivation Failed',
          response.message || 'Failed to deactivate user. Please try again.',
          5000
        );
      }
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        showError(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          5000
        );
        removeAuthToken();
        navigate('/admin/login', { replace: true });
      } else {
        showError(
          'Deactivation Failed',
          error.message || 'Failed to deactivate user. Please try again.',
          5000
        );
      }
    }
  };

  const handleUserReactivation = async (userId: string) => {
    try {
      const response = await verificationAPI.updateEmploymentStatus(userId, 'active');
      
      if (response.success) {
        showSuccess(
          'User Reactivated!',
          'Employee has been marked as active and end date has been cleared.',
          4000
        );
        
        // Reload data to reflect changes
        await loadData();
        await loadStats();
      } else {
        showError(
          'Reactivation Failed',
          response.message || 'Failed to reactivate user. Please try again.',
          5000
        );
      }
    } catch (error: any) {
      console.error('Error reactivating user:', error);
      
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        showError(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          5000
        );
        removeAuthToken();
        navigate('/admin/login', { replace: true });
      } else {
        showError(
          'Reactivation Failed',
          error.message || 'Failed to reactivate user. Please try again.',
          5000
        );
      }
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      removeAuthToken();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      removeAuthToken();
      navigate('/admin/login', { replace: true });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`;
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Add Data functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleAddDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !addDataForm.name || !addDataForm.email || !addDataForm.idNumber || 
        !addDataForm.jobTitle || !addDataForm.department || !addDataForm.startDate) {
      showError(
        'Missing Information',
        'Please fill all required fields and select a document',
        4000
      );
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('name', addDataForm.name);
      formData.append('email', addDataForm.email);
      formData.append('phone', addDataForm.phone);
      formData.append('idNumber', addDataForm.idNumber);
      formData.append('jobTitle', addDataForm.jobTitle);
      formData.append('department', addDataForm.department);
      formData.append('startDate', addDataForm.startDate);

      const response = await verificationAPI.uploadDocument(formData);
      
      if (response.success) {
        showSuccess(
          'Employee Added Successfully!',
          `Verification request for employee ${addDataForm.name} has been created successfully.`,
          5000
        );
        
        setUploadResult(response);
        
        // Reset form
        setSelectedFile(null);
        setAddDataForm({ name: '', email: '', phone: '', idNumber: '', jobTitle: '', department: '', startDate: '' });
        
        // Refresh data
        await loadData();
        await loadStats();
      } else {
        showError(
          'Upload Failed',
          response.message || 'Failed to upload document. Please try again.',
          5000
        );
        setUploadResult({
          success: false,
          message: response.message || 'Upload failed'
        });
      }
    } catch (error: any) {
      console.error('Document upload error:', error);
      
      const errorMessage = error.message || 'Upload failed';
      showError(
        'Upload Failed',
        errorMessage,
        5000
      );
      
      setUploadResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setUploading(false);
    }
  };

  // Navigation items - Filter based on user role
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
    { id: 'verifications', icon: '🛡️', label: 'Verifications' },
    { id: 'users', icon: '👥', label: 'Employees' },
    // Only show admin-related options to SuperAdmins
    ...(currentUser?.role === 'superadmin' ? [
      { id: 'admins', icon: '👤', label: 'Admins' },
      { id: 'create-admin', icon: '👑', label: 'Create Admin' }
    ] : []),
    { id: 'adddata', icon: '🏢', label: 'Add Employee' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  // Show loading while checking authentication
  if (!authChecked) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
          : 'bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900'
      }`}>
        {/* Floating Orbs */}
        <div className={`absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-40 animate-pulse ${
          darkMode 
            ? 'bg-gradient-to-r from-gray-600 to-gray-500'
            : 'bg-gradient-to-r from-cyan-400 to-blue-500'
        }`}></div>
        <div className={`absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-40 animate-pulse ${
          darkMode 
            ? 'bg-gradient-to-r from-gray-700 to-gray-600'
            : 'bg-gradient-to-r from-pink-400 to-purple-600'
        }`}></div>
        
        <div className={`flex items-center space-x-4 backdrop-blur-3xl rounded-2xl p-8 border shadow-[0_0_40px_rgba(168,85,247,0.4)] ${
          darkMode 
            ? 'bg-gray-800/40 border-gray-700/50'
            : 'bg-white/15 border-white/30'
        }`}>
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
            darkMode ? 'border-gray-400' : 'border-cyan-400'
          }`}></div>
          <span className={`text-lg font-medium ${
            darkMode ? 'text-gray-200' : 'text-white'
          }`}>Loading Dashboard...</span>
        </div>
      </div>
    );
  }

    return (
      <div className={`min-h-screen transition-all duration-300 relative overflow-hidden ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
          : 'bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900'
      }`}>
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
        </div>
        <div className={`absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse ${
          darkMode 
            ? 'bg-gradient-to-r from-gray-600 to-gray-500'
            : 'bg-gradient-to-r from-cyan-400 to-blue-500'
        }`}></div>
        <div className={`absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse ${
          darkMode 
            ? 'bg-gradient-to-r from-gray-700 to-gray-600'
            : 'bg-gradient-to-r from-pink-400 to-purple-600'
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse ${
          darkMode 
            ? 'bg-gradient-to-r from-gray-500 to-gray-700'
            : 'bg-gradient-to-r from-purple-400 to-indigo-500'
        }`}></div>      <div className="flex h-screen relative z-10">
        
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 ease-in-out relative z-50 ${
          mobileMenuOpen ? 'fixed inset-y-0 left-0' : 'hidden lg:block'
        }`}>
          <div className={`h-full backdrop-blur-3xl border-r shadow-[0_0_40px_rgba(168,85,247,0.3)] ${
            darkMode 
              ? 'bg-gray-900/60 border-gray-700/50' 
              : 'bg-white/10 border-white/20'
          }`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`flex items-center justify-between p-6 border-b ${
              darkMode ? 'border-gray-700/50' : 'border-white/20'
            }`}>
              <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.6)] ${
                  darkMode 
                    ? 'bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600'
                    : 'bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500'
                }`}>
                  <span className="text-white font-bold text-sm">ID</span>
                </div>
                {sidebarOpen && (
                  <div className="flex flex-col">
                    <span className={`text-xl font-bold bg-clip-text text-transparent ${
                      darkMode 
                        ? 'bg-gradient-to-r from-gray-300 to-white'
                        : 'bg-gradient-to-r from-cyan-300 to-white'
                    }`}>ID Verify</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-white/70'}`}>Admin Panel</span>
                  </div>
                )}
              </div>
              
              {/* Mobile Close Button */}
              {mobileMenuOpen && (
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`lg:hidden p-2 transition-all duration-300 rounded-xl backdrop-blur-md ${
                    darkMode 
                      ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-800/40'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">✕</span>
                </button>
              )}
            </div>              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'create-admin') {
                        navigate('/admin/create-admin');
                      } else {
                        setActiveTab(item.id as any);
                      }
                      // Close mobile menu when item is selected
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-300 group relative ${
                      activeTab === item.id
                        ? darkMode 
                          ? 'bg-gradient-to-r from-gray-700/60 via-gray-600/60 to-gray-700/60 text-white shadow-[0_0_20px_rgba(107,114,128,0.4)] backdrop-blur-md border border-gray-600/30'
                          : 'bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] backdrop-blur-md border border-white/20'
                        : darkMode
                          ? 'text-gray-300 hover:bg-gray-800/40 hover:text-white hover:shadow-[0_0_15px_rgba(107,114,128,0.2)] backdrop-blur-md'
                          : 'text-white/80 hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] backdrop-blur-md'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {sidebarOpen ? (
                      <span className="ml-3 font-medium">{item.label}</span>
                    ) : (
                      <div className={`absolute left-full ml-6 px-3 py-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-[999999] ${
                        darkMode 
                          ? 'bg-gray-800 text-gray-200 backdrop-blur-3xl border border-gray-700'
                          : 'bg-slate-900/95 text-white backdrop-blur-3xl border border-white/20'
                      }`} style={{ backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(15, 23, 42, 0.95)', zIndex: 999999 }}>
                        {item.label}
                      </div>
                    )}
                  </button>
                ))}
              </nav>

              {/* Sidebar Toggle */}
              <div className={`p-4 border-t ${darkMode ? 'border-gray-700/50' : 'border-white/20'}`}>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`w-full flex items-center justify-center p-3 transition-all duration-300 rounded-xl backdrop-blur-md ${
                    darkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">{sidebarOpen ? '⬅️' : '➡️'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navbar */}
          <AdminNavbar
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            notifications={notifications}
            showNotificationDropdown={showNotificationDropdown}
            setShowNotificationDropdown={setShowNotificationDropdown}
            showProfileDropdown={showProfileDropdown}
            setShowProfileDropdown={setShowProfileDropdown}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currentUser={currentUser}
            handleLogout={handleLogout}
            activeTab={activeTab}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6">
            
            {/* Add Employee Tab */}
            {activeTab === 'adddata' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white/15 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-[0_0_60px_rgba(168,85,247,0.4)] p-4 sm:p-8">
                  <div className="mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent mb-2">Add New Employee</h2>
                    <p className="text-white/80 text-sm sm:text-base">Enter employee information and upload their identity document for verification</p>
                  </div>
                  
                  <form onSubmit={handleAddDataSubmit} className="space-y-6 sm:space-y-8">
                    {/* Personal Information */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 sm:p-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center">
                        <span className="mr-2">🏢</span>
                        Employee Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-white/90">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={addDataForm.name}
                            onChange={(e) => setAddDataForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition duration-300 bg-white/10 backdrop-blur-md text-white placeholder-white/60 shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm sm:text-base"
                            placeholder="Enter employee's full name"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-white/90">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            value={addDataForm.email}
                            onChange={(e) => setAddDataForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition duration-300 bg-white/10 backdrop-blur-md text-white placeholder-white/60 shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm sm:text-base"
                            placeholder="Enter employee's email address"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-white/90">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={addDataForm.phone}
                            onChange={(e) => setAddDataForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition duration-300 bg-white/10 backdrop-blur-md text-white placeholder-white/60 shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm sm:text-base"
                            placeholder="Enter user's phone number"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-white/90">
                            ID Number *
                          </label>
                          <input
                            type="text"
                            value={addDataForm.idNumber}
                            onChange={(e) => setAddDataForm(prev => ({ ...prev, idNumber: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition duration-300 bg-white/10 backdrop-blur-md text-white placeholder-white/60 shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm sm:text-base"
                            placeholder="Enter user's ID number"
                            required
                          />
                        </div>
                      </div>

                      {/* Employment Information */}
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <span className="mr-2">💼</span>
                          Employment Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-white/90">
                              Job Title *
                            </label>
                            <input
                              type="text"
                              value={addDataForm.jobTitle}
                              onChange={(e) => setAddDataForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition duration-300 bg-white/10 backdrop-blur-md text-white placeholder-white/60 shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm sm:text-base"
                              placeholder="Enter job title"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-white/90">
                              Department *
                            </label>
                            <input
                              type="text"
                              value={addDataForm.department}
                              onChange={(e) => setAddDataForm(prev => ({ ...prev, department: e.target.value }))}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition duration-300 bg-white/10 backdrop-blur-md text-white placeholder-white/60 shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm sm:text-base"
                              placeholder="Enter department"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-white/90">
                              Start Date *
                            </label>
                            <input
                              type="date"
                              value={addDataForm.startDate}
                              onChange={(e) => setAddDataForm(prev => ({ ...prev, startDate: e.target.value }))}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition duration-300 bg-white/10 backdrop-blur-md text-white placeholder-white/60 shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm sm:text-base"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 sm:p-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center">
                        <span className="mr-2">📄</span>
                        Identity Document *
                      </h3>
                      <div
                        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 ${
                          dragActive
                            ? 'border-cyan-400 bg-cyan-400/20 transform scale-105 shadow-[0_0_30px_rgba(34,211,238,0.5)]'
                            : selectedFile
                            ? 'border-green-400 bg-green-400/20 shadow-[0_0_30px_rgba(34,197,94,0.5)]'
                            : 'border-white/30 hover:border-white/50 hover:bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        {selectedFile ? (
                          <div className="text-green-300">
                            <div className="text-3xl sm:text-4xl mb-4">✅</div>
                            <p className="text-base sm:text-lg font-semibold mb-2 text-white">{selectedFile.name}</p>
                            <p className="text-xs sm:text-sm text-white/70 mb-4">
                              Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm">
                              <span className="px-3 py-1 bg-green-400/30 text-green-200 rounded-full border border-green-400/40">Ready to upload</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-white/80">
                            <div className="text-3xl sm:text-4xl mb-4">📤</div>
                            <p className="text-lg sm:text-xl font-semibold mb-2 text-white">
                              Drop document here or click to browse
                            </p>
                            <p className="text-xs sm:text-sm mb-4">
                              Supports: JPG, PNG, PDF • Maximum size: 10MB
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-white/60">
                              <span>• Passport</span>
                              <span>• Driver's License</span>
                              <span>• National ID</span>
                            </div>
                          </div>
                        )}
                        
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="mt-4 sm:mt-6 inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-medium rounded-xl hover:scale-105 cursor-pointer transition duration-300 transform shadow-[0_0_20px_rgba(168,85,247,0.6)] text-sm sm:text-base"
                        >
                          <span className="mr-2">📤</span>
                          {selectedFile ? 'Change Document' : 'Select Document'}
                        </label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={uploading || !selectedFile || !addDataForm.name || !addDataForm.email || !addDataForm.idNumber || 
                        !addDataForm.jobTitle || !addDataForm.department || !addDataForm.startDate}
                      className="w-full py-3 sm:py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-semibold rounded-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition duration-300 transform shadow-[0_0_30px_rgba(168,85,247,0.6)] text-base sm:text-lg"
                    >
                      {uploading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white mr-3"></div>
                          Processing Document...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className="mr-2">🛡️</span>
                          Add Verification Request
                        </div>
                      )}
                    </button>
                  </form>

                  {/* Upload Result */}
                  {uploadResult && (
                    <div className={`mt-6 sm:mt-8 p-4 sm:p-6 rounded-2xl border-l-4 backdrop-blur-md ${
                      uploadResult.success 
                        ? 'bg-green-400/20 border-green-400 text-green-200' 
                        : 'bg-red-400/20 border-red-400 text-red-200'
                    } shadow-[0_0_30px_rgba(168,85,247,0.3)]`}>
                      <div className="flex flex-col sm:flex-row sm:items-start">
                        <div className="flex-shrink-0 mb-3 sm:mb-0">
                          <div className="text-xl sm:text-2xl">
                            {uploadResult.success ? '✅' : '❌'}
                          </div>
                        </div>
                        <div className="sm:ml-3">
                          <h4 className="text-base sm:text-lg font-semibold mb-1">
                            {uploadResult.success ? 'Verification Request Added!' : 'Upload Failed'}
                          </h4>
                          <p className="text-xs sm:text-sm">{uploadResult.message}</p>
                          {uploadResult.success && uploadResult.verificationId && (
                            <div className="mt-3 p-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                              <p className="text-xs sm:text-sm font-medium text-white/90 mb-1">Verification ID:</p>
                              <code className="text-xs sm:text-sm bg-white/20 px-2 py-1 rounded font-mono text-white break-all">
                                {uploadResult.verificationId}
                              </code>
                              <p className="text-xs text-white/70 mt-2">
                                Verification request has been added to the system
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Enhanced Data Scope Information */}
                {currentUser && (
                  <div className="bg-white/10 backdrop-blur-3xl rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)] p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${
                          currentUser.role === 'superadmin' ? 'bg-purple-500 animate-pulse' : 'bg-blue-500'
                        }`}></div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {currentUser.role === 'superadmin' ? '🌟 SuperAdmin Dashboard' : '👤 Admin Dashboard'}
                          </h3>
                          <p className="text-white/80 text-sm">
                            {currentUser.role === 'superadmin' 
                              ? 'You have access to all system data and analytics across all admins. You can see the complete overview of the entire ID verification system.'
                              : 'You can only view and manage data that you have created. Other admins\' data is private and not visible to you.'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${
                          currentUser.role === 'superadmin' 
                            ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border-purple-400/40' 
                            : 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-200 border-blue-400/40'
                        }`}>
                          {currentUser.role === 'superadmin' ? 'SYSTEM-WIDE ACCESS' : 'PERSONAL DATA ONLY'}
                        </div>
                        <p className="text-xs text-white/60 mt-1">
                          Logged in as: {currentUser.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className={`backdrop-blur-3xl p-4 sm:p-6 rounded-2xl border transition-all duration-300 transform hover:-translate-y-2 ${
                    darkMode 
                      ? 'bg-gradient-to-br from-gray-700/40 to-gray-800/40 text-gray-100 border-gray-600/30 shadow-[0_0_40px_rgba(107,114,128,0.4)] hover:shadow-[0_0_60px_rgba(107,114,128,0.6)]'
                      : 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-white border-white/20 shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:shadow-[0_0_60px_rgba(34,211,238,0.6)]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-white/80'}`}>Total Employees</p>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.totalUsers || users.length || 0}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-white/70'}`}>
                          {dashboardStats?.overview?.userGrowthPercent > 0 ? '+' : ''}
                          {dashboardStats?.overview?.userGrowthPercent || 0}% from last month
                        </p>
                      </div>
                      <div className="text-3xl sm:text-4xl opacity-80">🏢</div>
                    </div>
                  </div>

                  <div className={`backdrop-blur-3xl p-4 sm:p-6 rounded-2xl border transition-all duration-300 transform hover:-translate-y-2 ${
                    darkMode 
                      ? 'bg-gradient-to-br from-green-700/40 to-emerald-800/40 text-gray-100 border-green-600/30 shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:shadow-[0_0_60px_rgba(34,197,94,0.6)]'
                      : 'bg-gradient-to-br from-green-500/30 to-emerald-600/30 text-white border-white/20 shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:shadow-[0_0_60px_rgba(34,197,94,0.6)]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-white/80'}`}>Today's Activity</p>
                        <p className="text-2xl sm:text-3xl font-bold">{dashboardStats?.activity?.today?.verifications || 0}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-white/70'}`}>Verifications today</p>
                      </div>
                      <div className="text-3xl sm:text-4xl opacity-80">⚡</div>
                    </div>
                  </div>

                  <div className={`backdrop-blur-3xl p-4 sm:p-6 rounded-2xl border transition-all duration-300 transform hover:-translate-y-2 ${
                    darkMode 
                      ? 'bg-gradient-to-br from-purple-700/40 to-indigo-800/40 text-gray-100 border-purple-600/30 shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]'
                      : 'bg-gradient-to-br from-purple-500/30 to-indigo-600/30 text-white border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-white/80'}`}>Total Verifications</p>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.totalVerifications}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-white/70'}`}>All time verifications</p>
                      </div>
                      <div className="text-3xl sm:text-4xl opacity-80">✅</div>
                    </div>
                  </div>

                  <div className={`backdrop-blur-3xl p-4 sm:p-6 rounded-2xl border transition-all duration-300 transform hover:-translate-y-2 ${
                    darkMode 
                      ? 'bg-gradient-to-br from-orange-700/40 to-red-700/40 text-gray-100 border-orange-600/30 shadow-[0_0_40px_rgba(251,146,60,0.4)] hover:shadow-[0_0_60px_rgba(251,146,60,0.6)]'
                      : 'bg-gradient-to-br from-orange-500/30 to-red-500/30 text-white border-white/20 shadow-[0_0_40px_rgba(251,146,60,0.4)] hover:shadow-[0_0_60px_rgba(251,146,60,0.6)]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-white/80'}`}>Pending Reviews</p>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.pendingVerifications}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-white/70'}`}>Needs attention</p>
                      </div>
                      <div className="text-3xl sm:text-4xl opacity-80">⏳</div>
                    </div>
                  </div>
                </div>

                {/* Charts and Tasks Row */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                  {/* Enhanced User Growth Analytics Chart */}
                  <div className="xl:col-span-2 relative group">
                    {/* Background Glow Effects */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse"></div>
                    <div className="absolute -inset-2 bg-gradient-to-br from-cyan-400/20 via-purple-400/20 to-pink-400/20 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                    
                    {/* Main Chart Container */}
                    <div className="relative bg-gradient-to-br from-white/20 via-white/15 to-white/10 backdrop-blur-3xl p-4 sm:p-6 rounded-2xl border border-white/30 shadow-[0_0_60px_rgba(168,85,247,0.5)] group-hover:shadow-[0_0_80px_rgba(34,211,238,0.6)] transition-all duration-700">
                      {/* Animated Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
                        <div className="relative">
                          <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent animate-pulse">
                            📈 User Growth Analytics
                          </h3>
                          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <p className="text-white/70 text-xs sm:text-sm mt-1 relative z-10">
                            Real-time growth insights with trend analysis
                          </p>
                        </div>
                        
                        {/* Enhanced Time Period Buttons */}
                        <div className="flex flex-wrap gap-2 relative">
                          {/* Floating indicator */}
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          <button 
                            onClick={() => handleAnalyticsPeriodChange('7d')}
                            className={`relative px-4 py-2 text-xs sm:text-sm rounded-xl border backdrop-blur-md transition-all duration-500 transform hover:scale-105 ${
                              analyticsPeriod === '7d' 
                                ? 'bg-gradient-to-r from-cyan-500/40 to-blue-500/40 text-cyan-200 border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-pulse' 
                                : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 border-white/20 hover:border-white/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                            }`}
                          >
                            <span className="relative z-10">7D</span>
                            {analyticsPeriod === '7d' && (
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl animate-pulse"></div>
                            )}
                          </button>
                          
                          <button 
                            onClick={() => handleAnalyticsPeriodChange('30d')}
                            className={`relative px-4 py-2 text-xs sm:text-sm rounded-xl border backdrop-blur-md transition-all duration-500 transform hover:scale-105 ${
                              analyticsPeriod === '30d' 
                                ? 'bg-gradient-to-r from-cyan-500/40 to-blue-500/40 text-cyan-200 border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-pulse' 
                                : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 border-white/20 hover:border-white/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                            }`}
                          >
                            <span className="relative z-10">30D</span>
                            {analyticsPeriod === '30d' && (
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl animate-pulse"></div>
                            )}
                          </button>
                          
                          <button 
                            onClick={() => handleAnalyticsPeriodChange('90d')}
                            className={`relative px-4 py-2 text-xs sm:text-sm rounded-xl border backdrop-blur-md transition-all duration-500 transform hover:scale-105 ${
                              analyticsPeriod === '90d' 
                                ? 'bg-gradient-to-r from-cyan-500/40 to-blue-500/40 text-cyan-200 border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-pulse' 
                                : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 border-white/20 hover:border-white/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                            }`}
                          >
                            <span className="relative z-10">90D</span>
                            {analyticsPeriod === '90d' && (
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl animate-pulse"></div>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Chart with Enhanced Styling */}
                      <div className="relative">
                        {/* Chart Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
                        </div>
                        
                        {/* Main Chart */}
                        <div className="relative z-10">
                          <UserGrowthChart data={userGrowthData} loading={analyticsLoading} />
                        </div>
                        
                        {/* Floating Stats Cards */}
                        {userGrowthData && userGrowthData.length > 0 && !analyticsLoading && (
                          <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-700 transform -translate-y-4 group-hover:translate-y-0">
                            <div className="grid grid-cols-1 gap-2">
                              {/* Total Growth */}
                              <div className="bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-xl rounded-lg px-3 py-2 border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.4)] animate-pulse">
                                <div className="text-xs text-cyan-300 font-semibold mb-1 flex items-center">
                                  <span className="mr-1">🚀</span>
                                  Total Growth
                                </div>
                                <div className="text-sm text-white font-bold">
                                  +{userGrowthData.reduce((sum: number, item: any) => sum + item.users, 0)}
                                </div>
                              </div>
                              
                              {/* Trend Indicator */}
                              <div className="bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-xl rounded-lg px-3 py-2 border border-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse">
                                <div className="text-xs text-purple-300 font-semibold mb-1 flex items-center">
                                  <span className="mr-1">📊</span>
                                  Trend
                                </div>
                                <div className="text-sm text-white font-bold flex items-center">
                                  {userGrowthData.length > 1 && 
                                   userGrowthData[userGrowthData.length - 1].users > userGrowthData[userGrowthData.length - 2].users ? (
                                    <><span className="text-green-400 mr-1">↗️</span>Growing</>
                                  ) : (
                                    <><span className="text-red-400 mr-1">↘️</span>Declining</>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tasks Widget */}
                  <div className="bg-white/15 backdrop-blur-3xl p-4 sm:p-6 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className="text-lg sm:text-xl font-bold text-white">Tasks</h3>
                      <span className="text-xs sm:text-sm text-white/70">{tasks.filter(t => !t.completed).length} pending</span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-md">
                          <button
                            onClick={() => toggleTask(task.id)}
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                              task.completed
                                ? 'bg-green-500 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.6)]'
                                : 'border-white/40 hover:border-green-400'
                            }`}
                          >
                            {task.completed && <span className="text-xs">✓</span>}
                          </button>
                          <span className={`flex-1 text-xs sm:text-sm ${task.completed ? 'line-through text-white/50' : 'text-white'}`}>
                            {task.text}
                          </span>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-red-300 hover:text-red-200 transition-colors duration-300 flex-shrink-0"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Add new task..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                        className="flex-1 px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-xs sm:text-sm"
                      />
                      <button
                        onClick={addTask}
                        className="px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:scale-105 transition-all duration-300 text-xs sm:text-sm shadow-[0_0_15px_rgba(168,85,247,0.6)] flex-shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Users Table */}
                <div className="bg-white/15 backdrop-blur-3xl rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)] overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-white/20">
                    <h3 className="text-xl sm:text-2xl font-bold text-white">Recent Verifications</h3>
                    <p className="text-white/70 text-xs sm:text-sm mt-1">Latest verification requests</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/20">
                      <thead className="bg-white/10 backdrop-blur-md">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Verification ID</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">User</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider hidden sm:table-cell">ID Number</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Status</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/5 backdrop-blur-md divide-y divide-white/10">
                        {verifications.slice(0, 5).map((verification) => (
                          <tr key={verification._id} className="hover:bg-white/10 transition-all duration-300">
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="text-xs font-mono text-cyan-300 bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-white/20">
                                #{verification._id.slice(-8).toUpperCase()}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.6)] flex-shrink-0">
                                  <span className="text-white font-medium text-xs sm:text-sm">
                                    {verification.name?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-2 sm:ml-4 min-w-0">
                                  <div className="text-xs sm:text-sm font-medium text-white truncate">{verification.name}</div>
                                  <div className="text-xs text-white/70 truncate">{verification.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                              <div className="text-xs sm:text-sm font-mono text-yellow-300">
                                {verification.idNumber || 'N/A'}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md ${
                                verification.status === 'approved' ? 'bg-green-400/30 text-green-200 border border-green-400/40' :
                                verification.status === 'pending' ? 'bg-yellow-400/30 text-yellow-200 border border-yellow-400/40' :
                                'bg-red-400/30 text-red-200 border border-red-400/40'
                              }`}>
                                {verification.status}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                              <button 
                                onClick={() => setActiveTab('verifications')}
                                className="text-cyan-300 hover:text-cyan-200 transition-colors duration-300"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <CalendarComponent />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Data Scope Information */}
                {currentUser && (
                  <div className="bg-white/10 backdrop-blur-3xl rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)] p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          currentUser.role === 'superadmin' ? 'bg-purple-500' : 'bg-blue-500'
                        }`}></div>
                        <span className="text-white/80 text-xs sm:text-sm">
                          {currentUser.role === 'superadmin' 
                            ? 'Analytics showing data from all admins and system-wide statistics'
                            : 'Analytics showing only your created data and personal performance metrics'
                          }
                        </span>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-xs font-medium self-start sm:self-auto ${
                        currentUser.role === 'superadmin' 
                          ? 'bg-purple-500/20 text-purple-200' 
                          : 'bg-blue-500/20 text-blue-200'
                      }`}>
                        {currentUser.role.toUpperCase()} VIEW
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics Controls */}
                <div className="bg-white/15 backdrop-blur-3xl rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)] p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-4 sm:space-y-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-white">Analytics Dashboard</h3>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleAnalyticsPeriodChange('7d')}
                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border backdrop-blur-md transition-all duration-300 ${
                          analyticsPeriod === '7d' 
                            ? 'bg-cyan-400/30 text-cyan-200 border-cyan-400/40' 
                            : 'text-white/70 hover:bg-white/10 border-white/20'
                        }`}
                      >
                        Last 7 Days
                      </button>
                      <button 
                        onClick={() => handleAnalyticsPeriodChange('30d')}
                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border backdrop-blur-md transition-all duration-300 ${
                          analyticsPeriod === '30d' 
                            ? 'bg-cyan-400/30 text-cyan-200 border-cyan-400/40' 
                            : 'text-white/70 hover:bg-white/10 border-white/20'
                        }`}
                      >
                        Last 30 Days
                      </button>
                      <button 
                        onClick={() => handleAnalyticsPeriodChange('90d')}
                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border backdrop-blur-md transition-all duration-300 ${
                          analyticsPeriod === '90d' 
                            ? 'bg-cyan-400/30 text-cyan-200 border-cyan-400/40' 
                            : 'text-white/70 hover:bg-white/10 border-white/20'
                        }`}
                      >
                        Last 90 Days
                      </button>
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Verification Trends */}
                  <div className="bg-white/15 backdrop-blur-3xl p-4 sm:p-6 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Verification Trends</h3>
                    <VerificationTrendsChart data={verificationTrendsData} loading={analyticsLoading} />
                  </div>

                  {/* Status Distribution */}
                  <div className="bg-white/15 backdrop-blur-3xl p-4 sm:p-6 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Status Distribution</h3>
                    <StatusDistributionChart 
                      data={{
                        approved: stats.approvedVerifications,
                        pending: stats.pendingVerifications,
                        rejected: stats.rejectedVerifications
                      }} 
                      loading={loading} 
                    />
                  </div>

                  {/* System Activity */}
                  <div className="bg-white/15 backdrop-blur-3xl p-4 sm:p-6 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">24-Hour Activity</h3>
                    <SystemActivityChart data={systemActivityData} loading={analyticsLoading} />
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-white/15 backdrop-blur-3xl p-4 sm:p-6 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Performance Metrics</h3>
                    <PerformanceChart data={performanceData} loading={analyticsLoading} />
                  </div>
                </div>

                {/* Enhanced User Growth Full Width Section */}
                <div className="relative group">
                  {/* Multi-layered Background Glow Effects */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-60 animate-pulse"></div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-cyan-400/30 via-purple-400/30 to-pink-400/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-80 transition-all duration-1000"></div>
                  
                  {/* Main Container */}
                  <div className="relative bg-gradient-to-br from-white/20 via-white/15 to-white/10 backdrop-blur-3xl p-4 sm:p-6 rounded-2xl border border-white/30 shadow-[0_0_60px_rgba(168,85,247,0.5)] group-hover:shadow-[0_0_100px_rgba(34,211,238,0.7)] transition-all duration-1000">
                    
                    {/* Enhanced Header with Floating Elements */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 sm:mb-6 space-y-4 lg:space-y-0 relative">
                      <div className="relative">
                        <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
                          📈 Comprehensive User Growth Analytics
                        </h3>
                        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 blur-lg rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <p className="text-white/80 text-sm sm:text-base mt-2 relative z-10">
                          Deep insights into user acquisition patterns and growth trends over time
                        </p>
                        
                        {/* Floating Stats Badges */}
                        {userGrowthData && userGrowthData.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-4 group-hover:translate-y-0">
                            <div className="px-4 py-2 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 backdrop-blur-xl rounded-full border border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                              <span className="text-xs text-cyan-200 font-semibold">
                                🎯 Peak Day: {Math.max(...userGrowthData.map((item: any) => item.users))} users
                              </span>
                            </div>
                            <div className="px-4 py-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-xl rounded-full border border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                              <span className="text-xs text-purple-200 font-semibold">
                                📊 Avg: {Math.round(userGrowthData.reduce((sum: number, item: any) => sum + item.users, 0) / userGrowthData.length)} per day
                              </span>
                            </div>
                            <div className="px-4 py-2 bg-gradient-to-r from-green-500/30 to-emerald-500/30 backdrop-blur-xl rounded-full border border-green-400/40 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                              <span className="text-xs text-green-200 font-semibold">
                                🚀 Total: {userGrowthData.reduce((sum: number, item: any) => sum + item.users, 0)} new users
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Advanced Period Selector */}
                      <div className="relative">
                        <div className="flex flex-wrap gap-2 p-2 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                          <button 
                            onClick={() => handleAnalyticsPeriodChange('7d')}
                            className={`relative px-4 py-3 text-sm rounded-xl border backdrop-blur-md transition-all duration-500 transform hover:scale-105 ${
                              analyticsPeriod === '7d' 
                                ? 'bg-gradient-to-r from-cyan-500/50 to-blue-500/50 text-cyan-100 border-cyan-400/70 shadow-[0_0_25px_rgba(34,211,238,0.6)]' 
                                : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-white/15 hover:to-white/10 border-white/20 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                            }`}
                          >
                            <span className="relative z-10 font-semibold">Last 7 Days</span>
                            {analyticsPeriod === '7d' && (
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl animate-pulse"></div>
                            )}
                          </button>
                          
                          <button 
                            onClick={() => handleAnalyticsPeriodChange('30d')}
                            className={`relative px-4 py-3 text-sm rounded-xl border backdrop-blur-md transition-all duration-500 transform hover:scale-105 ${
                              analyticsPeriod === '30d' 
                                ? 'bg-gradient-to-r from-cyan-500/50 to-blue-500/50 text-cyan-100 border-cyan-400/70 shadow-[0_0_25px_rgba(34,211,238,0.6)]' 
                                : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-white/15 hover:to-white/10 border-white/20 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                            }`}
                          >
                            <span className="relative z-10 font-semibold">Last 30 Days</span>
                            {analyticsPeriod === '30d' && (
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl animate-pulse"></div>
                            )}
                          </button>
                          
                          <button 
                            onClick={() => handleAnalyticsPeriodChange('90d')}
                            className={`relative px-4 py-3 text-sm rounded-xl border backdrop-blur-md transition-all duration-500 transform hover:scale-105 ${
                              analyticsPeriod === '90d' 
                                ? 'bg-gradient-to-r from-cyan-500/50 to-blue-500/50 text-cyan-100 border-cyan-400/70 shadow-[0_0_25px_rgba(34,211,238,0.6)]' 
                                : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-white/15 hover:to-white/10 border-white/20 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                            }`}
                          >
                            <span className="relative z-10 font-semibold">Last 90 Days</span>
                            {analyticsPeriod === '90d' && (
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl animate-pulse"></div>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Chart Container */}
                    <div className="relative">
                      {/* Animated Grid Background */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="w-full h-full bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[length:40px_40px] animate-pulse"></div>
                      </div>
                      
                      {/* Floating Orbs */}
                      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                      <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-1000 delay-300"></div>
                      
                      {/* Main Chart */}
                      <div className="relative z-10 h-64 sm:h-80">
                        <UserGrowthChart data={userGrowthData} loading={analyticsLoading} />
                      </div>
                      
                      {/* Bottom Glow Bar */}
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white/15 backdrop-blur-3xl rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)] p-4 sm:p-6">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Settings</h3>
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 space-y-3 sm:space-y-0">
                    <div>
                      <h4 className="font-medium text-white">Dark Mode</h4>
                      <p className="text-xs sm:text-sm text-white/70">Toggle dark/light theme</p>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 focus:outline-none self-start sm:self-auto ${
                        darkMode ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-white/20'
                      } shadow-[0_0_15px_rgba(168,85,247,0.4)]`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${
                          darkMode ? 'translate-x-6' : 'translate-x-1'
                        } shadow-[0_0_10px_rgba(255,255,255,0.6)]`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 space-y-3 sm:space-y-0">
                    <div>
                      <h4 className="font-medium text-white">Email Notifications</h4>
                      <p className="text-xs sm:text-sm text-white/70">Receive email updates</p>
                    </div>
                    <button className="relative inline-flex items-center h-6 rounded-full w-11 bg-gradient-to-r from-cyan-500 to-purple-500 transition-colors duration-200 focus:outline-none shadow-[0_0_15px_rgba(168,85,247,0.4)] self-start sm:self-auto">
                      <span className="inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 translate-x-6 shadow-[0_0_10px_rgba(255,255,255,0.6)]" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Original Tabs Content - Updated with glassmorphism styling */}
            {(activeTab === 'verifications' || activeTab === 'users' || activeTab === 'admins') && (
              <div className="bg-white/15 backdrop-blur-3xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)] rounded-2xl">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  </div>
                ) : (
                  <>
                    {/* Verifications Tab */}
                    {activeTab === 'verifications' && (
                      <div className="overflow-x-auto">
                        <div className="p-4 sm:p-6 border-b border-white/20">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                            <div>
                              <h3 className="text-xl sm:text-2xl font-bold text-white">
                                {currentUser?.role === 'superadmin' ? 'All ID Verifications' : 'My ID Verifications'}
                              </h3>
                              <p className="text-white/70 text-xs sm:text-sm mt-1">
                                {currentUser?.role === 'superadmin' 
                                  ? 'View and manage all ID verification requests from all admins' 
                                  : 'View and manage only the ID verifications you have created'
                                }
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-xs font-medium self-start sm:self-auto ${
                              currentUser?.role === 'superadmin' 
                                ? 'bg-purple-500/20 text-purple-200' 
                                : 'bg-blue-500/20 text-blue-200'
                            }`}>
                              {currentUser?.role === 'superadmin' ? 'ALL DATA' : 'MY DATA'}
                            </div>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-white/20">
                            <thead className="bg-white/10 backdrop-blur-md">
                              <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Verification ID</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">User Details</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider hidden lg:table-cell">ID Number</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider hidden md:table-cell">Document</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider hidden xl:table-cell">Job Title</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider hidden xl:table-cell">Department</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Status</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider hidden sm:table-cell">Date</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white/5 backdrop-blur-md divide-y divide-white/10">
                              {verifications.map((verification) => (
                                <tr key={verification._id} className="hover:bg-white/10 transition-all duration-300">
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                    <div className="text-xs font-mono text-cyan-300 bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-white/20">
                                      #{verification._id.slice(-8).toUpperCase()}
                                    </div>
                                    <div className="text-xs text-white/60 mt-1 hidden xl:block">
                                      Full ID: {verification._id}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.6)] flex-shrink-0">
                                        <span className="text-white font-medium text-xs sm:text-sm">
                                          {verification.name?.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="ml-2 sm:ml-3 min-w-0">
                                        <div className="text-xs sm:text-sm font-medium text-white truncate">{verification.name}</div>
                                        <div className="text-xs text-white/70 truncate">{verification.email}</div>
                                        {verification.phone && (
                                          <div className="text-xs text-white/60 truncate hidden sm:block">{verification.phone}</div>
                                        )}
                                        {/* Show ID Number on mobile */}
                                        <div className="text-xs font-mono text-yellow-300 lg:hidden">
                                          ID: {verification.idNumber || 'N/A'}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                                    <div className="text-xs sm:text-sm font-mono text-yellow-300 bg-yellow-400/20 backdrop-blur-md px-3 py-1 rounded-lg border border-yellow-400/40">
                                      {verification.idNumber || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                    <a
                                      href={verification.documentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1 text-xs bg-cyan-400/20 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-400/30 transition-all duration-300 rounded-lg border border-cyan-400/40 backdrop-blur-md"
                                    >
                                      <span className="mr-1">📄</span>
                                      View Document
                                    </a>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs text-white/70 hidden xl:table-cell">
                                    {verification.jobTitle || '-'}
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs text-white/70 hidden xl:table-cell">
                                    {verification.department || '-'}
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                    <span className={getStatusBadge(verification.status)}>
                                      {verification.status}
                                    </span>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs text-white/70 hidden sm:table-cell">
                                    <div>{formatDate(verification.createdAt)}</div>
                                    {verification.updatedAt !== verification.createdAt && (
                                      <div className="text-xs text-white/50 mt-1">
                                        Updated: {formatDate(verification.updatedAt)}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs font-medium">
                                    {verification.status === 'pending' && (
                                      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                        <button
                                          onClick={() => handleVerificationStatusChange(verification._id, 'approved')}
                                          className="px-2 sm:px-3 py-1 bg-green-400/20 text-green-300 hover:text-green-200 hover:bg-green-400/30 transition-all duration-300 rounded-lg border border-green-400/40 backdrop-blur-md text-xs"
                                        >
                                          ✅ Approve
                                        </button>
                                        <button
                                          onClick={() => handleVerificationStatusChange(verification._id, 'rejected')}
                                          className="px-2 sm:px-3 py-1 bg-red-400/20 text-red-300 hover:text-red-200 hover:bg-red-400/30 transition-all duration-300 rounded-lg border border-red-400/40 backdrop-blur-md text-xs"
                                        >
                                          ❌ Reject
                                        </button>
                                      </div>
                                    )}
                                    {verification.status === 'approved' && (
                                      <div className="flex items-center text-green-300 text-xs">
                                        <span className="mr-1">✅</span>
                                        Verified
                                      </div>
                                    )}
                                    {verification.status === 'rejected' && (
                                      <div className="flex items-center text-red-300 text-xs">
                                        <span className="mr-1">❌</span>
                                        Rejected
                                      </div>
                                    )}
                                    {/* Show document link on mobile */}
                                    <div className="md:hidden mt-2">
                                      <a
                                        href={verification.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-2 py-1 text-xs bg-cyan-400/20 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-400/30 transition-all duration-300 rounded-lg border border-cyan-400/40 backdrop-blur-md"
                                      >
                                        <span className="mr-1">📄</span>
                                        Doc
                                      </a>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Employees Tab */}
                    {activeTab === 'users' && (
                      <div className="overflow-x-auto">
                        <div className="p-4 sm:p-6 border-b border-white/20">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                            <div>
                              <h3 className="text-xl sm:text-2xl font-bold text-white">
                                {currentUser?.role === 'superadmin' ? 'All Employees Management' : 'My Employees Management'}
                              </h3>
                              <p className="text-white/70 text-xs sm:text-sm mt-1">
                                {currentUser?.role === 'superadmin' 
                                  ? 'View and manage all registered employees from all admins' 
                                  : 'View and manage only employees whose verifications you have created'
                                }
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-xs font-medium self-start sm:self-auto ${
                              currentUser?.role === 'superadmin' 
                                ? 'bg-purple-500/20 text-purple-200' 
                                : 'bg-blue-500/20 text-blue-200'
                            }`}>
                              {currentUser?.role === 'superadmin' ? 'ALL EMPLOYEES' : 'MY EMPLOYEES'}
                            </div>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-white/20">
                            <thead className="bg-white/10 backdrop-blur-md">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Employee</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider hidden md:table-cell">Position</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Employment</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white/5 backdrop-blur-md divide-y divide-white/10">
                              {users.map((user) => (
                                <tr key={user._id} className="hover:bg-white/10 transition-all duration-300">
                                  {/* Employee Info */}
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-white font-medium text-sm">
                                          {user.name?.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-white">{user.name}</div>
                                        <div className="text-xs text-white/60 sm:hidden">{user.email}</div>
                                        {user.idNumber && (
                                          <div className="text-xs text-cyan-300 font-mono">ID: {user.idNumber}</div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  
                                  {/* Contact Info */}
                                  <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                                    <div className="text-xs text-white/80">
                                      <div className="truncate max-w-[180px]">{user.email}</div>
                                      <div className="text-white/60">{user.phone || 'No phone'}</div>
                                    </div>
                                  </td>
                                  
                                  {/* Position */}
                                  <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                                    <div className="text-xs text-white/80">
                                      <div className="font-medium">{user.jobTitle || '-'}</div>
                                      <div className="text-white/60">{user.department || '-'}</div>
                                    </div>
                                  </td>
                                  
                                  {/* Employment Status */}
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="space-y-1">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md ${
                                        user.employmentStatus === 'active' 
                                          ? 'bg-green-400/30 text-green-200 border border-green-400/40' 
                                          : 'bg-red-400/30 text-red-200 border border-red-400/40'
                                      }`}>
                                        {user.employmentStatus === 'active' ? 'Working' : 'Not Working'}
                                      </span>
                                      {user.endDate && (
                                        <div className="text-xs text-red-300">
                                          End: {formatDate(user.endDate)}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  
                                  {/* Joined Date */}
                                  <td className="px-4 py-4 whitespace-nowrap text-xs text-white/80 hidden lg:table-cell">
                                    {formatDate(user.createdAt)}
                                  </td>
                                  
                                  {/* Actions */}
                                  <td className="px-4 py-4 whitespace-nowrap text-xs font-medium">
                                    {user.employmentStatus === 'active' ? (
                                      <button
                                        onClick={() => handleUserDeactivation(user._id)}
                                        className="px-3 py-1 bg-red-400/20 text-red-300 hover:text-red-200 hover:bg-red-400/30 transition-all duration-300 rounded-lg border border-red-400/40 backdrop-blur-md text-xs"
                                      >
                                        Deactivate
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleUserReactivation(user._id)}
                                        className="px-3 py-1 bg-green-400/20 text-green-300 hover:text-green-200 hover:bg-green-400/30 transition-all duration-300 rounded-lg border border-green-400/40 backdrop-blur-md text-xs cursor-pointer"
                                      >
                                        Reactivate
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Admins Tab - Only for SuperAdmin */}
                    {activeTab === 'admins' && currentUser?.role === 'superadmin' && (
                      <div className="overflow-x-auto">
                        <div className="p-4 sm:p-6 border-b border-white/20">
                          <h3 className="text-xl sm:text-2xl font-bold text-white">
                            Admin Management
                          </h3>
                          <p className="text-white/70 text-xs sm:text-sm mt-1">
                            Manage all administrators in the system
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-white/20">
                            <thead className="bg-white/10 backdrop-blur-md">
                              <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Name</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Email</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider hidden md:table-cell">Department</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Role</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Status</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider hidden lg:table-cell">Created</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white/5 backdrop-blur-md divide-y divide-white/10">
                              {admins.map((admin) => (
                                <tr key={admin._id} className="hover:bg-white/10 transition-all duration-300">
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-white">
                                    {admin.name || 'N/A'}
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white/80">
                                    <div className="truncate max-w-[150px] sm:max-w-none">{admin.email}</div>
                                    {/* Show department on mobile */}
                                    <div className="text-xs text-white/60 md:hidden">
                                      {admin.department || 'No dept'}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white/80 hidden md:table-cell">
                                    <div>{admin.department || 'N/A'}</div>
                                    <div className="text-xs text-white/60">{admin.designation || 'No designation'}</div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white/80">
                                    {admin.role}
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md ${
                                      admin.isActive ? 'bg-green-400/30 text-green-200 border border-green-400/40' : 'bg-red-400/30 text-red-200 border border-red-400/40'
                                    }`}>
                                      {admin.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    {/* Show created date on mobile */}
                                    <div className="text-xs text-white/60 mt-1 lg:hidden">
                                      {formatDate(admin.createdAt)}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white/80 hidden lg:table-cell">
                                    {formatDate(admin.createdAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="bg-white/10 backdrop-blur-md px-3 sm:px-4 py-3 flex items-center justify-between border-t border-white/20 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-white/20 text-xs sm:text-sm font-medium rounded-md text-white bg-white/10 backdrop-blur-md hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-3 sm:px-4 py-2 border border-white/20 text-xs sm:text-sm font-medium rounded-md text-white bg-white/10 backdrop-blur-md hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-white/80">
                              Page <span className="font-medium">{currentPage}</span> of{' '}
                              <span className="font-medium">{totalPages}</span>
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/20 bg-white/10 backdrop-blur-md text-xs sm:text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/20 bg-white/10 backdrop-blur-md text-xs sm:text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                              >
                                Next
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default AdminDashboard;