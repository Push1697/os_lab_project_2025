import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, authAPI, removeAuthToken } from '../api/api';
import AdminNavbar from '../components/AdminNavbar';

interface AdminFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: 'admin' | 'superadmin';
}

const CreateAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AdminFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'admin'
  });
  const [errors, setErrors] = useState<Partial<AdminFormData>>({});
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Navbar states for AdminNavbar component
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(3);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024); // Only open by default on desktop

  useEffect(() => {
    checkAuthAndLoadUser();
  }, []);

  const checkAuthAndLoadUser = async () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    
    try {
      const response = await authAPI.getProfile();
      const adminData = response.admin;
      
      // Check if user is SuperAdmin
      if (adminData.role !== 'superadmin') {
        console.log('Access denied: Only SuperAdmins can create admins');
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      
      setCurrentUser(adminData);
      setAuthChecked(true);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      removeAuthToken();
      navigate('/admin/login', { replace: true });
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

  const validateForm = (): boolean => {
    const newErrors: Partial<AdminFormData> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof AdminFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitResult(null);

    try {
      const adminData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role
      };

      await adminAPI.createAdmin(adminData);
      
      setSubmitResult({
        success: true,
        message: 'Admin created successfully!'
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'admin'
      });

      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 2000);

    } catch (error) {
      setSubmitResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create admin'
      });
    } finally {
      setLoading(false);
    }
  };

  const goBackToDashboard = () => {
    navigate('/admin/dashboard');
  };

  // Navigation items for sidebar
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
    { id: 'verifications', icon: '🛡️', label: 'Verifications' },
    { id: 'users', icon: '👥', label: 'Users' },
    // Only show admin-related options to SuperAdmins
    ...(currentUser?.role === 'superadmin' ? [
      { id: 'admins', icon: '👤', label: 'Admins' },
      { id: 'create-admin', icon: '👑', label: 'Create Admin' }
    ] : []),
    { id: 'adddata', icon: '📝', label: 'Add Data' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  // Show loading while checking authentication
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-10 md:top-20 left-10 md:left-20 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-10 md:bottom-20 right-10 md:right-20 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        
        <div className="flex items-center space-x-4 bg-white/15 backdrop-blur-3xl rounded-2xl p-6 md:p-8 border border-white/30 shadow-[0_0_40px_rgba(168,85,247,0.4)] mx-4">
          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-cyan-400"></div>
          <span className="text-white text-base md:text-lg font-medium">Loading...</span>
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
          ? 'bg-gradient-to-r from-gray-500 to-gray-600'
          : 'bg-gradient-to-r from-pink-400 to-purple-600'
      }`}></div>
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse ${
        darkMode 
          ? 'bg-gradient-to-r from-gray-600 to-gray-700'
          : 'bg-gradient-to-r from-purple-400 to-indigo-500'
      }`}></div>

      <div className="flex h-screen relative z-10">
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
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'dashboard') {
                      navigate('/admin/dashboard');
                    } else if (item.id === 'create-admin') {
                      // Already on create admin page
                    } else if (item.id === 'adddata') {
                      // Navigate to dashboard with adddata tab active
                      navigate('/admin/dashboard', { state: { activeTab: 'adddata' } });
                    } else {
                      // For other tabs, go to dashboard with the tab selected
                      navigate('/admin/dashboard', { state: { activeTab: item.id } });
                    }
                    // Close mobile menu when item is selected
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-300 group relative ${
                    item.id === 'create-admin'
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
                    ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-800/40'
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
          {/* AdminNavbar Component */}
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
            activeTab="Create Admin"
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
            {/* Breadcrumb */}
            <div className="mb-4 md:mb-6">
              <nav className="flex items-center space-x-2 text-white/70 text-xs md:text-sm">
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="hover:text-white transition-colors duration-300"
                >
                  Dashboard
                </button>
                <span>→</span>
                <span className="text-white">Create Admin</span>
              </nav>
            </div>

            {/* Form Container */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/15 backdrop-blur-3xl rounded-2xl md:rounded-3xl border border-white/20 shadow-[0_0_60px_rgba(168,85,247,0.4)] p-4 md:p-6 lg:p-8">
              
              {/* Page Header */}
              <div className="mb-6 md:mb-8 text-center">
                <div className="flex items-center justify-center space-x-3 mb-3 md:mb-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.6)]">
                    <span className="text-white font-bold text-lg md:text-2xl">👑</span>
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent mb-2">
                  Create New Administrator
                </h2>
                <p className="text-white/80 text-sm md:text-base lg:text-lg">Add a new administrator to the ID verification system</p>
              </div>
              
              {/* Result Message */}
              {submitResult && (
                <div className={`mb-4 md:mb-6 p-3 md:p-4 rounded-xl backdrop-blur-md border ${
                  submitResult.success 
                    ? 'bg-green-500/20 border-green-400/30 text-green-100' 
                    : 'bg-red-500/20 border-red-400/30 text-red-100'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg md:text-xl">{submitResult.success ? '✅' : '❌'}</span>
                    <span className="font-medium text-sm md:text-base">{submitResult.message}</span>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Personal Information Section */}
                <div className="space-y-4 md:space-y-6">
                  <h3 className="text-lg md:text-xl font-semibold text-white border-b border-white/20 pb-2">
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-3 md:px-4 py-3 md:py-4 bg-white/10 backdrop-blur-md border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 touch-manipulation ${
                          errors.name ? 'border-red-400' : 'border-white/20'
                        }`}
                        placeholder="Enter full name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs md:text-sm text-red-300">{errors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 md:px-4 py-3 md:py-4 bg-white/10 backdrop-blur-md border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 touch-manipulation ${
                          errors.email ? 'border-red-400' : 'border-white/20'
                        }`}
                        placeholder="admin@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs md:text-sm text-red-300">{errors.email}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-3 md:px-4 py-3 md:py-4 bg-white/10 backdrop-blur-md border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 touch-manipulation ${
                          errors.phone ? 'border-red-400' : 'border-white/20'
                        }`}
                        placeholder="+91 9876543210"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs md:text-sm text-red-300">{errors.phone}</p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Role *
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-3 md:px-4 py-3 md:py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 touch-manipulation"
                      >
                        <option value="admin" className="bg-gray-800">Admin</option>
                        <option value="superadmin" className="bg-gray-800">Super Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Security Information Section */}
                <div className="space-y-4 md:space-y-6">
                  <h3 className="text-lg md:text-xl font-semibold text-white border-b border-white/20 pb-2">
                    Security Information
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-3 md:px-4 py-3 md:py-4 bg-white/10 backdrop-blur-md border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 touch-manipulation ${
                          errors.password ? 'border-red-400' : 'border-white/20'
                        }`}
                        placeholder="Enter strong password"
                      />
                      {errors.password && (
                        <p className="mt-1 text-xs md:text-sm text-red-300">{errors.password}</p>
                      )}
                      <p className="mt-1 text-xs text-white/60">
                        Password must contain uppercase, lowercase, and number
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-3 md:px-4 py-3 md:py-4 bg-white/10 backdrop-blur-md border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 touch-manipulation ${
                          errors.confirmPassword ? 'border-red-400' : 'border-white/20'
                        }`}
                        placeholder="Confirm password"
                      />
                      {errors.confirmPassword && (
                        <p className="mt-1 text-xs md:text-sm text-red-300">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 md:pt-6">
                  <button
                    type="button"
                    onClick={goBackToDashboard}
                    className="w-full sm:w-auto px-6 md:px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 md:px-8 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm md:text-base"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-base md:text-lg">👑</span>
                        <span>Create Admin</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
        </div>
      </div>
    </div>
  );
};

export default CreateAdmin;