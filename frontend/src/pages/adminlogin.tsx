import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, setAuthToken } from '../api/api';
import { ToastContainer, useToast } from '../components/Toast';

interface AdminLoginProps {
  onLogin?: (token: string, role: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();

  // Toast notifications
  const { toasts, removeToast, showSuccess: showSuccessToast, showError } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      // Validate existing token
      validateExistingToken(token);
    }
  }, [navigate]);

  const validateExistingToken = async (token: string) => {
    setIsValidating(true);
    try {
      // You can add a token validation API call here
      setAuthToken(token);
      navigate('/admin/dashboard');
    } catch (error) {
      // Token is invalid, remove it
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    } finally {
      setIsValidating(false);
    }
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('Email address is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      console.log('Login response:', response);
      
      if (response.success && response.token) {
        // Show success toast instead of popup
        showSuccessToast(
          'Login Successful!',
          `Welcome back to the admin dashboard.`,
          3000
        );
        
        // Show success state
        setShowSuccess(true);
        
        // Set auth token in both localStorage and sessionStorage
        setAuthToken(response.token);
        
        // Store additional user session data in sessionStorage
        sessionStorage.setItem('adminEmail', response.email || email);
        sessionStorage.setItem('adminRole', response.role || 'admin');
        sessionStorage.setItem('loginTime', new Date().toISOString());
        sessionStorage.setItem('isLoggedIn', 'true');
        
        // Also store in localStorage for persistence
        localStorage.setItem('adminEmail', response.email || email);
        localStorage.setItem('adminRole', response.role || 'admin');
        localStorage.setItem('isLoggedIn', 'true');
        
        // Call the onLogin callback if provided
        if (onLogin) {
          onLogin(response.token, response.role);
        }
        
        // Wait for success animation then navigate
        setTimeout(() => {
          navigate('/admin/dashboard', { replace: true });
        }, 2000);
      } else {
        const errorMsg = response.message || 'Invalid credentials. Please try again.';
        setError(errorMsg);
        showError(
          'Login Failed',
          errorMsg,
          5000
        );
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Authentication failed. Please check your credentials and try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showError(
        'Login Error',
        errorMessage,
        5000
      );
    } finally {
      setLoading(false);
    }
  };

  // Success Popup Component
  const SuccessPopup = () => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${showSuccess ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-green-400/30 shadow-2xl transform transition-all duration-500 ${showSuccess ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100/20 mb-4">
            <svg className="h-8 w-8 text-green-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Login Successful!</h3>
          <p className="text-green-200 mb-4">Welcome back, Admin</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
          </div>
          <p className="text-white/60 text-sm mt-2">Redirecting to dashboard...</p>
        </div>
      </div>
    </div>
  );

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Validating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Success Popup */}
      <SuccessPopup />

      {/* Background decoration */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl w-full space-y-6 sm:space-y-8 relative z-10 animate-fadeInUp">
        {/* Header */}
        <div className="text-center px-2">
          <h2 className="mt-4 sm:mt-8 text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Admin Portal
          </h2>
          <p className="mt-3 text-base sm:text-lg lg:text-xl text-gray-300 font-medium">
            Secure ID Verification Dashboard
          </p>
          <div className="mt-4 w-24 sm:w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-white/20 mx-2 sm:mx-0">
          <form className="space-y-6 sm:space-y-7" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 px-4 py-3 sm:px-5 sm:py-4 rounded-xl animate-shake">
                <div className="flex items-center">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 mr-3 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-sm sm:text-base">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 sm:space-y-3">
              <label htmlFor="email" className="block text-sm sm:text-base font-semibold text-white/90 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Email Address *
              </label>
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="block w-full px-4 py-4 sm:px-5 sm:py-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/15 text-base sm:text-lg"
                  placeholder="Enter your email address"
                />
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-white/90 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password *
              </label>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="block w-full px-4 py-4 sm:px-5 sm:py-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/15 text-base sm:text-lg"
                  placeholder="Enter your password"
                />
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="pt-3 sm:pt-4">
              <button
                type="submit"
                disabled={loading || showSuccess}
                className="group relative w-full flex justify-center py-4 sm:py-5 px-6 text-lg sm:text-xl font-bold rounded-xl sm:rounded-2xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl touch-manipulation"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></span>
                <span className="relative flex items-center">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white mr-3"></div>
                      Authenticating...
                    </>
                  ) : showSuccess ? (
                    <>
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Login Successful
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 sm:w-6 sm:w-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In to Dashboard
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4 px-2">
          <div className="flex items-center justify-center space-x-2 text-white/60">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm sm:text-base font-medium">ID Verification System</span>
          </div>
          <p className="text-xs sm:text-sm text-white/40">
            Secure • Reliable • Professional Admin Portal
          </p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default AdminLogin;