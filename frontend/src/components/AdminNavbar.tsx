import React from 'react';
import { Link } from 'react-router-dom';

interface AdminNavbarProps {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  autoRefresh: boolean;
  setAutoRefresh: (autoRefresh: boolean) => void;
  notifications: number;
  showNotificationDropdown: boolean;
  setShowNotificationDropdown: (show: boolean) => void;
  showProfileDropdown: boolean;
  setShowProfileDropdown: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: any;
  handleLogout: () => void;
  activeTab: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({
  darkMode,
  setDarkMode,
  autoRefresh,
  setAutoRefresh,
  notifications,
  showNotificationDropdown,
  setShowNotificationDropdown,
  showProfileDropdown,
  setShowProfileDropdown,
  searchQuery,
  setSearchQuery,
  currentUser,
  handleLogout,
  activeTab,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  return (
    <header className={`backdrop-blur-3xl border-b shadow-[0_0_30px_rgba(168,85,247,0.3)] ${
      darkMode 
        ? 'bg-gray-900/60 border-gray-700/50'
        : 'bg-white/10 border-white/20'
    }`}>
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center space-x-4 flex-1">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 transition-all duration-300 rounded-xl backdrop-blur-md ${
              darkMode 
                ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-800/40'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-xl">☰</span>
          </button>
          
          <h1 className={`text-lg md:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent ${
            darkMode 
              ? 'bg-gradient-to-r from-gray-300 to-white'
              : 'bg-gradient-to-r from-cyan-300 to-white'
          }`}>
            <span className="hidden sm:inline">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            <span className="sm:hidden">{activeTab.length > 10 ? activeTab.substring(0, 10) + '...' : activeTab}</span>
          </h1>
          
          {/* Role indicator - Hidden on mobile */}
          {currentUser && (
            <div className="hidden lg:flex items-center space-x-2">
              <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
                currentUser.role === 'superadmin' 
                  ? darkMode 
                    ? 'bg-gray-700/40 text-gray-300 border-gray-600/40'
                    : 'bg-purple-500/20 text-purple-200 border-purple-500/40'
                  : darkMode
                    ? 'bg-gray-600/40 text-gray-300 border-gray-500/40'
                    : 'bg-blue-500/20 text-blue-200 border-blue-500/40'
              }`}>
                {currentUser.role === 'superadmin' ? '🌟 SuperAdmin Access' : '👤 Admin Access'}
              </div>
            </div>
          )}
          
          {/* Search Bar - Hidden on mobile */}
          <div className="hidden lg:block flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className={darkMode ? 'text-gray-400' : 'text-white/60'}>🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`block w-full pl-10 pr-3 py-3 border rounded-xl backdrop-blur-md transition-all duration-300 focus:outline-none focus:ring-2 focus:border-transparent shadow-[0_0_15px_rgba(255,255,255,0.1)] ${
                  darkMode 
                    ? 'border-gray-600/40 bg-gray-800/40 text-gray-200 placeholder-gray-400 focus:ring-gray-500'
                    : 'border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-cyan-400'
                }`}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 md:p-3 transition-all duration-300 rounded-xl backdrop-blur-md ${
              darkMode 
                ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-800/40'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-lg md:text-xl">{darkMode ? '☀️' : '🌙'}</span>
          </button>

          {/* Auto-refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 md:p-3 transition-all duration-300 rounded-xl backdrop-blur-md ${
              autoRefresh 
                ? darkMode
                  ? 'text-green-400 bg-green-400/20 hover:bg-green-400/30'
                  : 'text-green-400 bg-green-400/20 hover:bg-green-400/30'
                : darkMode
                  ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-800/40'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          >
            <span className="text-lg md:text-xl">{autoRefresh ? '🔄' : '⏸️'}</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              data-notification-button
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              className={`relative p-2 md:p-3 transition-all duration-300 rounded-xl backdrop-blur-md ${
                darkMode 
                  ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-800/40'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-lg md:text-xl">🔔</span>
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                  {notifications}
                </span>
              )}
            </button>
            
            {showNotificationDropdown && (
              <div data-notification-dropdown className={`absolute right-0 mt-2 w-72 md:w-80 rounded-2xl border shadow-[0_0_40px_rgba(168,85,247,0.4)] py-2 z-[999999] ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700/50 backdrop-blur-3xl'
                  : 'bg-slate-900/95 border-white/20 backdrop-blur-3xl'
              }`} style={{ backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(15, 23, 42, 0.95)', zIndex: 999999 }}>
                <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700/50' : 'border-white/20'}`}>
                  <h3 className={`font-semibold text-sm md:text-base ${darkMode ? 'text-gray-200' : 'text-white'}`}>Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className={`px-4 py-3 transition-all duration-300 cursor-pointer ${
                    darkMode ? 'hover:bg-gray-700/60' : 'hover:bg-white/20'
                  }`}>
                    <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-300' : 'text-white'}`}>New verification request received</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-white/60'}`}>2 minutes ago</p>
                  </div>
                  <div className={`px-4 py-3 transition-all duration-300 cursor-pointer ${
                    darkMode ? 'hover:bg-gray-700/60' : 'hover:bg-white/20'
                  }`}>
                    <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-300' : 'text-white'}`}>User profile updated</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-white/60'}`}>1 hour ago</p>
                  </div>
                  <div className={`px-4 py-3 transition-all duration-300 cursor-pointer ${
                    darkMode ? 'hover:bg-gray-700/60' : 'hover:bg-white/20'
                  }`}>
                    <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-300' : 'text-white'}`}>System maintenance scheduled</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-white/60'}`}>3 hours ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              data-profile-button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={`flex items-center space-x-2 md:space-x-3 p-1 md:p-2 rounded-xl transition-all duration-300 backdrop-blur-md ${
                darkMode ? 'hover:bg-gray-800/40' : 'hover:bg-white/10'
              }`}
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.6)] ${
                darkMode 
                  ? 'bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600'
                  : 'bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500'
              }`}>
                <span className="text-white font-medium text-xs md:text-sm">
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className={`text-xs md:text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-white'} truncate max-w-[120px]`}>{currentUser?.email}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-white/60'}`}>{currentUser?.role}</p>
              </div>
              <span className={`${darkMode ? 'text-gray-400' : 'text-white/60'} hidden md:inline`}>⬇️</span>
            </button>

            {showProfileDropdown && (
              <div data-profile-dropdown className={`absolute right-0 mt-2 w-40 md:w-48 rounded-2xl border shadow-[0_0_40px_rgba(168,85,247,0.4)] py-2 z-[999999] ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700/50 backdrop-blur-3xl'
                  : 'bg-slate-900/95 border-white/20 backdrop-blur-3xl'
              }`} style={{ backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(15, 23, 42, 0.95)', zIndex: 999999 }}>
                <Link
                  to="/profile"
                  className={`block px-4 py-3 text-xs md:text-sm transition-all duration-300 ${
                    darkMode 
                      ? 'text-gray-300 hover:bg-gray-700/60 hover:text-gray-100'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  👤 Profile
                </Link>
                <Link
                  to="/settings"
                  className={`block px-4 py-3 text-xs md:text-sm transition-all duration-300 ${
                    darkMode 
                      ? 'text-gray-300 hover:bg-gray-700/60 hover:text-gray-100'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  ⚙️ Settings
                </Link>
                <hr className={`my-2 ${darkMode ? 'border-gray-700/50' : 'border-white/20'}`} />
                <button
                  onClick={handleLogout}
                  className={`block w-full text-left px-4 py-3 text-xs md:text-sm transition-all duration-300 ${
                    darkMode 
                      ? 'text-red-400 hover:bg-gray-700/60 hover:text-red-300'
                      : 'text-red-300 hover:bg-white/20'
                  }`}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;