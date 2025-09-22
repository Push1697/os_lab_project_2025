const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API configuration
const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Get auth token from localStorage or sessionStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// Add auth header if token exists
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { ...apiConfig.headers, Authorization: `Bearer ${token}` } : apiConfig.headers;
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getProfile: async () => {
    return apiRequest('/auth/profile');
  },

  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },
};

// Document verification API functions
export const verificationAPI = {
  uploadDocument: async (formData: FormData) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/document/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(errorData.message || `Upload failed! status: ${response.status}`);
    }

    return response.json();
  },

  getVerificationResult: async (verificationId: string) => {
    return apiRequest(`/document/verify/${verificationId}`);
  },

  // Verify ID document by ID number
  verifyIdDocument: async (idNumber: string) => {
    return apiRequest(`/verify/id/${encodeURIComponent(idNumber)}`);
  },

  // Get verification status by ID number  
  getVerificationStatus: async (idNumber: string) => {
    return apiRequest(`/verify/status/${encodeURIComponent(idNumber)}`);
  },

  getAllVerifications: async (page = 1, limit = 10, search?: string) => {
    let url = `/document/verifications?page=${page}&limit=${limit}`;
    if (search && search.trim()) {
      url += `&q=${encodeURIComponent(search.trim())}`;
    }
    return apiRequest(url);
  },

  updateVerificationStatus: async (verificationId: string, status: string, notes?: string) => {
    return apiRequest(`/document/verify/${verificationId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },

  updateEmploymentStatus: async (verificationId: string, employmentStatus: 'active' | 'former', endDate?: string) => {
    return apiRequest(`/document/${verificationId}/employment-status`, {
      method: 'PATCH',
      body: JSON.stringify({ employmentStatus, endDate }),
    });
  },

  getVerificationStats: async () => {
    return apiRequest('/document/stats');
  },
};

// User management API functions (for admin)
export const userAPI = {
  getAllUsers: async (page = 1, limit = 10, search?: string) => {
    let url = `/users?page=${page}&limit=${limit}`;
    if (search && search.trim()) {
      url += `&q=${encodeURIComponent(search.trim())}`;
    }
    return apiRequest(url);
  },

  getUserById: async (userId: string) => {
    return apiRequest(`/users/${userId}`);
  },

  updateUser: async (userId: string, userData: any) => {
    return apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (userId: string) => {
    return apiRequest(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Admin management API functions (for superadmin)
export const adminAPI = {
  getAllAdmins: async (page = 1, limit = 10) => {
    return apiRequest(`/admins?page=${page}&limit=${limit}`);
  },

  createAdmin: async (adminData: { 
    name: string;
    email: string; 
    password: string; 
    phone: string;
    role?: string;
  }) => {
    return apiRequest('/admins', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
  },

  updateAdmin: async (adminId: string, adminData: any) => {
    return apiRequest(`/admins/${adminId}`, {
      method: 'PUT',
      body: JSON.stringify(adminData),
    });
  },

  deactivateAdmin: async (adminId: string) => {
    return apiRequest(`/admins/${adminId}`, {
      method: 'DELETE',
    });
  },
};

// Analytics API functions (for dashboard charts and data)
export const analyticsAPI = {
  getDashboardStats: async () => {
    return apiRequest('/analytics/dashboard');
  },

  getUserGrowthData: async (period: string = '30d') => {
    return apiRequest(`/analytics/user-growth?period=${period}`);
  },

  getVerificationTrends: async (period: string = '30d') => {
    return apiRequest(`/analytics/verification-trends?period=${period}`);
  },

  getSystemActivity: async (period: string = '7d') => {
    return apiRequest(`/analytics/system-activity?period=${period}`);
  },

  getPerformanceMetrics: async (period: string = '30d') => {
    return apiRequest(`/analytics/performance?period=${period}`);
  },

  getCalendarEvents: async (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const queryString = params.toString();
    return apiRequest(`/analytics/calendar-events${queryString ? '?' + queryString : ''}`);
  },
};

// Helper functions
export const setAuthToken = (token: string) => {
  // Store in both localStorage and sessionStorage for flexibility
  localStorage.setItem('authToken', token);
  sessionStorage.setItem('authToken', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  // Clear additional session data
  sessionStorage.removeItem('adminEmail');
  sessionStorage.removeItem('adminRole');
  sessionStorage.removeItem('loginTime');
  sessionStorage.removeItem('isLoggedIn');
  localStorage.removeItem('adminEmail');
  localStorage.removeItem('adminRole');
  localStorage.removeItem('isLoggedIn');
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Get session information
export const getSessionInfo = () => {
  return {
    token: getAuthToken(),
    email: sessionStorage.getItem('adminEmail') || localStorage.getItem('adminEmail'),
    role: sessionStorage.getItem('adminRole') || localStorage.getItem('adminRole'),
    loginTime: sessionStorage.getItem('loginTime'),
    isLoggedIn: sessionStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isLoggedIn') === 'true'
  };
};

export default {
  authAPI,
  verificationAPI,
  userAPI,
  adminAPI,
  analyticsAPI,
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
  getSessionInfo,
};