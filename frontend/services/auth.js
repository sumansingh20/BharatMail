// Authentication service for handling login, logout, and token management 
class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.baseUrl = '/api/auth';
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.setAuthData(data.token, data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        this.setAuthData(data.token, data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async verifyToken() {
    if (!this.token) {
      return { valid: false, error: 'No token found' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        this.user = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
        return { valid: true, user: data.user };
      } else {
        this.clearAuthData();
        return { valid: false, error: data.error || 'Invalid token' };
      }
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearAuthData();
      return { valid: false, error: 'Network error' };
    }
  }

  logout() {
    this.clearAuthData();
    window.location.href = '/login.html';
  }

  setAuthData(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearAuthData() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  getToken() {
    return this.token;
  }

  getCurrentUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Helper method to add auth headers to fetch requests
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Wrapper for authenticated fetch requests
  async authenticatedFetch(url, options = {}) {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    const authOptions = {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      }
    };

    const response = await fetch(url, authOptions);

    // If unauthorized, clear auth data and redirect to login
    if (response.status === 401) {
      this.clearAuthData();
      window.location.href = '/login.html';
      throw new Error('Authentication required');
    }

    return response;
  }

  // Check if user needs to verify their email (if email verification is implemented)
  needsEmailVerification() {
    return this.user && !this.user.email_verified;
  }

  // Get user's display name
  getUserDisplayName() {
    if (!this.user) return 'Unknown User';
    return this.user.full_name || this.user.email || 'User';
  }

  // Get user's initials for avatar
  getUserInitials() {
    if (!this.user) return 'U';
    
    if (this.user.full_name) {
      const names = this.user.full_name.split(' ');
      return names.map(name => name.charAt(0).toUpperCase()).join('').substring(0, 2);
    }
    
    return this.user.email.charAt(0).toUpperCase();
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      const response = await this.authenticatedFetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        this.user = { ...this.user, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(this.user));
        return { success: true, user: this.user };
      } else {
        const error = await response.json();
        return { success: false, error: error.message || 'Update failed' };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.authenticatedFetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Password change failed' };
      }
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Request failed' };
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Initialize auth service - check for existing valid token
  async initialize() {
    if (this.token) {
      const verification = await this.verifyToken();
      return verification.valid;
    }
    return false;
  }
}

// Create global auth service instance
window.authService = new AuthService();
