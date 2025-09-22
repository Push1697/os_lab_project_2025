import React, { useState, useEffect } from 'react';
import { verificationAPI } from '../api/api';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  CreditCard,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface VerificationData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  idNumber?: string;
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  jobTitle?: string;
  department?: string;
  employmentStatus?: 'active' | 'former';
  startDate?: string;
  endDate?: string;
}

interface IdVerificationData {
  idNumber: string;
  name: string;
  email: string;
  phone?: string;
  documentType: string;
  verifiedAt: string;
  submittedAt: string;
  status: string;
  jobTitle?: string;
  department?: string;
  employmentStatus?: 'active' | 'former';
  startDate?: string;
  endDate?: string;
}

const VerifyResult: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [idVerification, setIdVerification] = useState<IdVerificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState<'verification' | 'id'>('id'); // Changed default to 'id'

  // Check for verification ID or ID number in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const idNumber = urlParams.get('idNumber');
    
    if (id) {
      setSearchValue(id);
      setSearchType('verification');
      handleSearch(id, 'verification');
    } else if (idNumber) {
      setSearchValue(idNumber);
      setSearchType('id');
      handleSearch(idNumber, 'id');
    }
  }, []);

  const handleSearch = async (value?: string, type?: 'verification' | 'id') => {
    const searchVal = value || searchValue;
    const searchTypeVal = type || searchType;
    
    if (!searchVal.trim()) {
      setError(`Please enter a ${searchTypeVal === 'id' ? 'ID number' : 'verification ID'}`);
      return;
    }

    setLoading(true);
    setError('');
    setVerification(null);
    setIdVerification(null);

    try {
      if (searchTypeVal === 'id') {
        const response = await verificationAPI.verifyIdDocument(searchVal.trim());
        if (response.success && response.verified && response.data) {
          setIdVerification(response.data);
        } else {
          setError('ID number not found or verification pending');
        }
      } else {
        const response = await verificationAPI.getVerificationResult(searchVal.trim());
        if (response.success && response.data) {
          setVerification(response.data);
        } else {
          setError('Verification not found');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch verification result');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, size = 'large') => {
    const iconSize = size === 'large' ? 'w-8 h-8' : 'w-5 h-5';
    const containerSize = size === 'large' ? 'h-16 w-16' : 'h-8 w-8';
    
    switch (status) {
      case 'approved':
        return (
          <div className={`mx-auto flex items-center justify-center ${containerSize} rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_30px_rgba(34,197,94,0.6)]`}>
            <CheckCircle className={`${iconSize} text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]`} />
          </div>
        );
      case 'rejected':
        return (
          <div className={`mx-auto flex items-center justify-center ${containerSize} rounded-full bg-gradient-to-r from-red-400 to-pink-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]`}>
            <XCircle className={`${iconSize} text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]`} />
          </div>
        );
      case 'pending':
      default:
        return (
          <div className={`mx-auto flex items-center justify-center ${containerSize} rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_30px_rgba(245,158,11,0.6)]`}>
            <Clock className={`${iconSize} text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]`} />
          </div>
        );
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          title: 'Verification Approved',
          message: 'Your identity document has been successfully verified and approved.',
          color: 'text-green-600'
        };
      case 'rejected':
        return {
          title: 'Verification Rejected',
          message: 'Your identity document verification was rejected. Please contact support for more information.',
          color: 'text-red-600'
        };
      case 'pending':
      default:
        return {
          title: 'Verification Pending',
          message: 'Your identity document is being reviewed. You will be notified once the verification is complete.',
          color: 'text-yellow-600'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 py-8 px-4">
      {/* Glowing Grid Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:40px_40px] shadow-2xl"></div>
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-40 animate-pulse shadow-[0_0_100px_rgba(34,211,238,0.7)]"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full blur-3xl opacity-40 animate-pulse shadow-[0_0_100px_rgba(219,39,119,0.7)]"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full mb-6 shadow-[0_0_60px_rgba(168,85,247,0.8),0_0_100px_rgba(34,211,238,0.6)]">
            <Search className="w-8 h-8 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]">
            ID Verification Lookup
          </h1>
          <p className="text-xl text-white/80 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            Enter your ID number to check verification status
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white/15 backdrop-blur-3xl rounded-2xl shadow-[0_0_80px_rgba(168,85,247,0.4),0_0_120px_rgba(34,211,238,0.3),inset_0_0_60px_rgba(255,255,255,0.1)] p-8 mb-8 border border-white/30">
          <div className="space-y-6">
            {/* Search Type Selector - Reordered with ID Number first */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                Search Method
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSearchType('id')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                    searchType === 'id'
                      ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                      : 'border-white/30 bg-white/10 text-white/70 hover:border-white/50 hover:bg-white/15'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    <span className="font-medium">ID Number</span>
                  </div>
                  <div className="text-xs mt-1 opacity-75">Recommended</div>
                </button>
                <button
                  onClick={() => setSearchType('verification')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                    searchType === 'verification'
                      ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                      : 'border-white/30 bg-white/10 text-white/70 hover:border-white/50 hover:bg-white/15'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <FileText className="w-5 h-5 mr-2" />
                    <span className="font-medium">Verification ID</span>
                  </div>
                  <div className="text-xs mt-1 opacity-75">Alternative</div>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label htmlFor="search-value" className="block text-sm font-medium text-white/90 mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {searchType === 'id' ? 'Enter Your ID Number' : 'Enter Verification ID'}
              </label>
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  {searchType === 'id' ? (
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  ) : (
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  )}
                  <input
                    id="search-value"
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={searchType === 'id' ? 'Enter your government issued ID number' : 'Enter your verification ID from email'}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition duration-200 text-white placeholder-white/50"
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-medium rounded-lg hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-[0_0_30px_rgba(168,85,247,0.7),0_0_60px_rgba(34,211,238,0.5)] hover:shadow-[0_0_50px_rgba(168,85,247,0.9),0_0_80px_rgba(34,211,238,0.7)]"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Searching...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Search className="w-5 h-5 mr-2" />
                      Check Status
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Helpful Note */}
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-md border border-blue-400/30 p-4 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                <div className="text-sm">
                  <p className="text-blue-300 font-medium mb-1">How to check your verification:</p>
                  <p className="text-blue-200 mb-2">
                    <strong>1. Start with ID Number:</strong> Enter your government ID number (Aadhaar, PAN, Driver's License, etc.) for instant verification status.
                  </p>
                  <p className="text-blue-200">
                    <strong>2. If ID Number doesn't work:</strong> Switch to "Verification ID" and use the ID sent to your email after document submission.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-md border border-red-400/30 p-6 rounded-lg mb-8 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-400 mr-3 drop-shadow-[0_0_10px_rgba(248,113,113,0.8)]" />
              <div>
                <h3 className="text-lg font-semibold text-red-300 mb-1">Search Failed</h3>
                <p className="text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* ID Verification Result */}
        {idVerification && (
          <div className="bg-white/15 backdrop-blur-3xl rounded-2xl shadow-[0_0_80px_rgba(168,85,247,0.4),0_0_120px_rgba(34,211,238,0.3),inset_0_0_60px_rgba(255,255,255,0.1)] p-8 border border-white/30">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_60px_rgba(34,197,94,0.8)] mb-4">
                <CheckCircle className="w-12 h-12 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
              </div>
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent mb-2 drop-shadow-[0_0_30px_rgba(34,197,94,0.6)]">
                ID Verified Successfully
              </h2>
              
              <p className="text-lg text-white/80 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                This ID number has been verified and is authentic
              </p>
            </div>

            {/* Verification Details */}
            <div className="border-t border-white/20 pt-8">
              <h3 className="text-xl font-semibold text-white/90 mb-6 flex items-center drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                <User className="w-6 h-6 mr-2 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                Verified Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">
                    ID Number
                  </label>
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 text-cyan-400 mr-2" />
                    <p className="text-lg font-semibold text-white/90">{idVerification.idNumber}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">
                    Document Type
                  </label>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-cyan-400 mr-2" />
                    <p className="text-white/90 capitalize">{idVerification.documentType.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">
                    Full Name
                  </label>
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-cyan-400 mr-2" />
                    <p className="text-white/90">{idVerification.name}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">
                    Email
                  </label>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-cyan-400 mr-2" />
                    <p className="text-white/90">{idVerification.email}</p>
                  </div>
                </div>

                {idVerification.phone && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">
                      Phone Number
                    </label>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-cyan-400 mr-2" />
                      <p className="text-white/90">{idVerification.phone}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">
                    Verified On
                  </label>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-cyan-400 mr-2" />
                    <p className="text-white/90">{formatDate(idVerification.verifiedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Employment Information Section */}
              {(idVerification.jobTitle || idVerification.department || idVerification.employmentStatus) && (
                <div className="mt-8 border-t border-white/20 pt-8">
                  <h3 className="text-xl font-semibold text-white/90 mb-6 flex items-center drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                    <span className="w-6 h-6 mr-2 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">💼</span>
                    Employment Information
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {idVerification.jobTitle && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/70">
                          Job Title
                        </label>
                        <p className="text-white/90">{idVerification.jobTitle}</p>
                      </div>
                    )}

                    {idVerification.department && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/70">
                          Department
                        </label>
                        <p className="text-white/90">{idVerification.department}</p>
                      </div>
                    )}

                    {idVerification.employmentStatus && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/70">
                          Employment Status
                        </label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md border ${
                          idVerification.employmentStatus === 'active' 
                            ? 'bg-green-500/20 text-green-300 border-green-400/30' 
                            : 'bg-gray-500/20 text-gray-300 border-gray-400/30'
                        }`}>
                          {idVerification.employmentStatus === 'active' ? '✅ Active Employee' : '⏸️ Former Employee'}
                        </span>
                      </div>
                    )}

                    {idVerification.startDate && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/70">
                          Start Date
                        </label>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-cyan-400 mr-2" />
                          <p className="text-white/90">{formatDate(idVerification.startDate)}</p>
                        </div>
                      </div>
                    )}

                    {idVerification.endDate && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/70">
                          End Date
                        </label>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-cyan-400 mr-2" />
                          <p className="text-white/90">{formatDate(idVerification.endDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-lg border border-green-400/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                  <p className="text-green-300 font-medium">
                    This identity document has been verified by our secure verification system
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Standard Verification Result */}
        {verification && (
          <div className="bg-white/15 backdrop-blur-3xl rounded-2xl shadow-[0_0_80px_rgba(168,85,247,0.4),0_0_120px_rgba(34,211,238,0.3),inset_0_0_60px_rgba(255,255,255,0.1)] p-8 border border-white/30">
            <div className="text-center mb-8">
              {getStatusIcon(verification.status)}
              
              <h2 className={`mt-4 text-3xl font-bold ${
                verification.status === 'approved' ? 'bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent' :
                verification.status === 'rejected' ? 'bg-gradient-to-r from-red-300 to-pink-300 bg-clip-text text-transparent' :
                'bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent'
              } drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]`}>
                {getStatusMessage(verification.status).title}
              </h2>
              
              <p className="mt-2 text-lg text-white/80 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {getStatusMessage(verification.status).message}
              </p>
            </div>

            {/* Verification Details */}
            <div className="border-t border-white/20 pt-8">
              <h3 className="text-xl font-semibold text-white/90 mb-6 flex items-center drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                <FileText className="w-6 h-6 mr-2 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                Verification Details
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">
                    Verification ID
                  </label>
                  <p className="text-sm font-mono bg-white/20 backdrop-blur-md px-3 py-2 rounded text-white/90 border border-white/20">
                    {verification._id}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">
                    Status
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md border shadow-lg ${
                    verification.status === 'approved' ? 'bg-green-500/20 text-green-300 border-green-400/30 shadow-[0_0_20px_rgba(34,197,94,0.4)]' :
                    verification.status === 'rejected' ? 'bg-red-500/20 text-red-300 border-red-400/30 shadow-[0_0_20px_rgba(239,68,68,0.4)]' :
                    'bg-yellow-500/20 text-yellow-300 border-yellow-400/30 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                  }`}>
                    {getStatusIcon(verification.status, 'small')}
                    <span className="ml-2">{verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">
                    Full Name
                  </label>
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-cyan-400 mr-2" />
                    <p className="text-white/90">{verification.name}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">
                    Email
                  </label>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-cyan-400 mr-2" />
                    <p className="text-white/90">{verification.email}</p>
                  </div>
                </div>

                {verification.phone && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">
                      Phone Number
                    </label>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-cyan-400 mr-2" />
                      <p className="text-white/90">{verification.phone}</p>
                    </div>
                  </div>
                )}

                {verification.idNumber && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">
                      ID Number
                    </label>
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 text-cyan-400 mr-2" />
                      <p className="text-white/90">{verification.idNumber}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">
                    Submitted On
                  </label>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-cyan-400 mr-2" />
                    <p className="text-white/90">{formatDate(verification.createdAt)}</p>
                  </div>
                </div>

                {verification.updatedAt !== verification.createdAt && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">
                      Last Updated
                    </label>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-cyan-400 mr-2" />
                      <p className="text-white/90">{formatDate(verification.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Employment Information Section */}
              {(verification.jobTitle || verification.department || verification.employmentStatus) && (
                <div className="mt-8 border-t border-white/20 pt-8">
                  <h3 className="text-xl font-semibold text-white/90 mb-6 flex items-center drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                    <span className="w-6 h-6 mr-2 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">💼</span>
                    Employment Information
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {verification.jobTitle && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/70">
                          Job Title
                        </label>
                        <p className="text-white/90">{verification.jobTitle}</p>
                      </div>
                    )}

                    {verification.department && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/70">
                          Department
                        </label>
                        <p className="text-white/90">{verification.department}</p>
                      </div>
                    )}

                    {verification.employmentStatus && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/70">
                          Employment Status
                        </label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md border ${
                          verification.employmentStatus === 'active' 
                            ? 'bg-green-500/20 text-green-300 border-green-400/30' 
                            : 'bg-gray-500/20 text-gray-300 border-gray-400/30'
                        }`}>
                          {verification.employmentStatus === 'active' ? '✅ Active Employee' : '⏸️ Former Employee'}
                        </span>
                      </div>
                    )}

                    {verification.startDate && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/70">
                          Start Date
                        </label>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-cyan-400 mr-2" />
                          <p className="text-white/90">{formatDate(verification.startDate)}</p>
                        </div>
                      </div>
                    )}

                    {verification.endDate && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/70">
                          End Date
                        </label>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-cyan-400 mr-2" />
                          <p className="text-white/90">{formatDate(verification.endDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {verification.notes && (
                <div className="mt-8">
                  <label className="block text-sm font-medium text-white/70 mb-3">
                    Admin Notes
                  </label>
                  <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 border border-white/20">
                    <p className="text-white/90">{verification.notes}</p>
                  </div>
                </div>
              )}

              {verification.documentUrl && (
                <div className="mt-8">
                  <label className="block text-sm font-medium text-white/70 mb-3">
                    Submitted Document
                  </label>
                  <a
                    href={verification.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-sm font-medium text-white/90 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-transparent transition duration-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Document
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section - Updated content */}
        <div className="mt-12 bg-white/15 backdrop-blur-3xl rounded-2xl shadow-[0_0_80px_rgba(168,85,247,0.4),0_0_120px_rgba(34,211,238,0.3),inset_0_0_60px_rgba(255,255,255,0.1)] p-8 border border-white/30">
          <h3 className="text-xl font-semibold text-white/90 mb-6 flex items-center drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            <AlertCircle className="w-6 h-6 mr-2 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            Need Help?
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-white/70">
            <div className="space-y-3">
              <p className="flex items-start">
                <span className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></span>
                <strong>Primary Method:</strong> Use your ID number for fastest verification lookup
              </p>
              <p className="flex items-start">
                <span className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></span>
                <strong>Backup Method:</strong> Use verification ID from your email if ID number fails
              </p>
            </div>
            <div className="space-y-3">
              <p className="flex items-start">
                <span className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></span>
                Verification typically takes 1-3 business days
              </p>
              <p className="flex items-start">
                <span className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></span>
                Contact support if both methods don't work
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyResult;