import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Home, CheckCircle, UserCog } from 'lucide-react';

interface HeaderProps {
  showAdminLink?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showAdminLink = true }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden shadow-2xl">
      {/* Professional gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10"></div>
      
      {/* Scanning line animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse opacity-60"></div>
        <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-transparent via-purple-400 to-transparent animate-pulse opacity-40"></div>
        <div className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-pulse opacity-40"></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-30"></div>
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-indigo-400 rounded-full animate-ping opacity-40 animation-delay-1000"></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping opacity-35 animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Responsive Logo */}
          <div className="flex items-center group">
            <div className="flex-shrink-0 relative">
              <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:shadow-blue-400/50 transition-all duration-500 transform group-hover:scale-110">
                {/* Scanning effect on logo */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <svg className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div className="ml-2 sm:ml-3 lg:ml-4">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-wider font-mono">
                ID VERIFY
              </h1>
              <div className="h-0.5 w-0 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-700"></div>
            </div>
          </div>

          {/* Desktop Navigation - responsive spacing */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-8 ml-auto">
            <Link
              to="/"
              className="group relative px-4 xl:px-6 py-2 xl:py-3 text-gray-200 font-medium transition-all duration-500 hover:text-blue-300"
            >
              {/* Horizontal scanning effect */}
              <div className="absolute inset-0 border border-gray-500/30 rounded-lg group-hover:border-blue-400/60 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-lg"></div>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-400 to-indigo-400 group-hover:w-full transition-all duration-700"></div>
              <div className="absolute top-0 right-0 h-0.5 w-0 bg-gradient-to-l from-purple-400 to-blue-400 group-hover:w-full transition-all duration-700 delay-100"></div>
              
              <div className="relative z-10 flex items-center space-x-2">
                <Home className="h-4 w-4 group-hover:text-blue-300 transition-colors duration-300" />
                <span className="font-mono tracking-wide text-sm xl:text-base">HOME</span>
              </div>
            </Link>

            <Link
              to="/verify-result"
              className="group relative px-4 xl:px-6 py-2 xl:py-3 text-gray-200 font-medium transition-all duration-500 hover:text-indigo-300"
            >
              <div className="absolute inset-0 border border-gray-500/30 rounded-lg group-hover:border-indigo-400/60 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-lg"></div>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-indigo-400 to-blue-400 group-hover:w-full transition-all duration-700"></div>
              <div className="absolute top-0 right-0 h-0.5 w-0 bg-gradient-to-l from-purple-400 to-indigo-400 group-hover:w-full transition-all duration-700 delay-100"></div>
              
              <div className="relative z-10 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 group-hover:text-indigo-300 transition-colors duration-300" />
                <span className="font-mono tracking-wide text-sm xl:text-base">STATUS</span>
              </div>
            </Link>

            {showAdminLink && (
              <Link
                to="/admin-login"
                className="group relative px-6 xl:px-8 py-2 xl:py-3 bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-bold rounded-lg overflow-hidden transition-all duration-500 hover:from-blue-600 hover:to-purple-700 border border-blue-500/50 hover:border-blue-400"
              >
                {/* Professional scanning animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                <div className="relative z-10 flex items-center space-x-2">
                  <UserCog className="h-4 w-4 xl:h-5 xl:w-5 group-hover:animate-spin transition-all duration-300" />
                  <span className="font-mono tracking-wider text-sm xl:text-base">ADMIN</span>
                </div>
              </Link>
            )}
          </nav>

          {/* Tablet Navigation - visible on medium screens */}
          <nav className="hidden md:flex lg:hidden items-center space-x-3 ml-auto">
            <Link to="/" className="p-3 text-gray-200 hover:text-blue-300 rounded-lg border border-gray-500/50 hover:border-blue-400/60 transition-all duration-300">
              <Home className="h-5 w-5" />
            </Link>
            <Link to="/verify-result" className="p-3 text-gray-200 hover:text-indigo-300 rounded-lg border border-gray-500/50 hover:border-indigo-400/60 transition-all duration-300">
              <CheckCircle className="h-5 w-5" />
            </Link>
            {showAdminLink && (
              <Link to="/admin-login" className="p-3 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-lg border border-blue-500/50 hover:border-blue-400 transition-all duration-300">
                <UserCog className="h-5 w-5" />
              </Link>
            )}
          </nav>

          {/* Mobile menu button - improved touch target */}
          <div className="md:hidden ml-auto">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="group relative p-3 sm:p-4 border border-gray-500 rounded-lg bg-blue-800/50 backdrop-blur-sm text-gray-200 hover:text-blue-300 transition-all duration-300 hover:border-blue-400/60 min-w-[48px] min-h-[48px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg"></div>
              {isMobileMenuOpen ? (
                <X className="relative z-10 h-6 w-6" />
              ) : (
                <Menu className="relative z-10 h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile menu - improved spacing and touch targets */}
      {isMobileMenuOpen && (
        <div className="md:hidden relative z-20 border-t border-indigo-600/50">
          <div className="px-3 sm:px-4 pt-2 pb-6 space-y-3 bg-gradient-to-b from-blue-900/95 to-indigo-900/95 backdrop-blur-xl">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="group relative block px-4 sm:px-6 py-4 sm:py-5 text-gray-200 font-medium transition-all duration-500 hover:text-blue-300 border border-gray-600/50 rounded-lg hover:border-blue-400/60 min-h-[56px] flex items-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-lg"></div>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-400 to-indigo-400 group-hover:w-full transition-all duration-700"></div>
              
              <div className="relative z-10 flex items-center space-x-3 w-full">
                <Home className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <span className="font-mono tracking-wide text-base sm:text-lg">HOME</span>
              </div>
            </Link>

            <Link
              to="/verify-result"
              onClick={() => setIsMobileMenuOpen(false)}
              className="group relative block px-4 sm:px-6 py-4 sm:py-5 text-gray-200 font-medium transition-all duration-500 hover:text-indigo-300 border border-gray-600/50 rounded-lg hover:border-indigo-400/60 min-h-[56px] flex items-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-lg"></div>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-indigo-400 to-blue-400 group-hover:w-full transition-all duration-700"></div>
              
              <div className="relative z-10 flex items-center space-x-3 w-full">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <span className="font-mono tracking-wide text-base sm:text-lg">STATUS</span>
              </div>
            </Link>

            {showAdminLink && (
              <Link
                to="/admin-login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="group relative block px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-bold rounded-lg border border-blue-500/50 hover:border-blue-400 transition-all duration-500 hover:from-blue-600 hover:to-purple-700 min-h-[56px] flex items-center"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                
                <div className="relative z-10 flex items-center space-x-3 w-full">
                  <UserCog className="h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-spin flex-shrink-0" />
                  <span className="font-mono tracking-wider text-base sm:text-lg">ADMIN</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;