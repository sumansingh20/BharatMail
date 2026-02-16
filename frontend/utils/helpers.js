// Utility functions for the Gmail clone application
class Utils {
  // Format file size in human readable format
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Format date and time for display
  static formatDateTime(date, options = {}) {
    const now = new Date();
    const targetDate = new Date(date);
    const diff = now - targetDate;
    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (options.relative !== false) {
      if (daysDiff === 0) {
        return targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (daysDiff === 1) {
        return 'Yesterday';
      } else if (daysDiff < 7) {
        return targetDate.toLocaleDateString([], { weekday: 'long' });
      }
    }

    if (options.includeTime) {
      return targetDate.toLocaleString();
    }

    return targetDate.toLocaleDateString();
  }

  // Escape HTML to prevent XSS
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Sanitize HTML content (basic sanitization)
  static sanitizeHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Remove dangerous elements
    const dangerousElements = div.querySelectorAll('script, object, embed, link[rel="stylesheet"], style');
    dangerousElements.forEach(el => el.remove());
    
    // Remove dangerous attributes
    const allElements = div.querySelectorAll('*');
    allElements.forEach(el => {
      const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'];
      dangerousAttrs.forEach(attr => el.removeAttribute(attr));
      
      // Remove javascript: urls
      ['href', 'src'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value && value.toLowerCase().startsWith('javascript:')) {
          el.removeAttribute(attr);
        }
      });
    });
    
    return div.innerHTML;
  }

  // Validate email address
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Parse email list (comma separated)
  static parseEmailList(emailString) {
    if (!emailString) return [];
    return emailString.split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  // Validate email list
  static validateEmailList(emailString) {
    const emails = this.parseEmailList(emailString);
    const invalid = emails.filter(email => !this.isValidEmail(email));
    return {
      valid: invalid.length === 0,
      invalidEmails: invalid,
      validEmails: emails.filter(email => this.isValidEmail(email))
    };
  }

  // Generate user initials from name or email
  static getInitials(name, email) {
    if (name && name.trim()) {
      const nameParts = name.trim().split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
      } else {
        return nameParts[0].charAt(0).toUpperCase();
      }
    } else if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  // Generate avatar color based on email
  static getAvatarColor(email) {
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#9aa0a6'
    ];
    
    if (!email) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    return colors[hash % colors.length];
  }

  // Debounce function for search and other operations
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  }

  // Throttle function for scroll events
  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Deep clone object
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  // Local storage helpers with error handling
  static getFromStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  static setToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  }

  static removeFromStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  // URL helpers
  static getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  static setQueryParam(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
  }

  static removeQueryParam(name) {
    const url = new URL(window.location);
    url.searchParams.delete(name);
    window.history.pushState({}, '', url);
  }

  // Event emitter for simple pub/sub
  static createEventEmitter() {
    const events = {};
    
    return {
      on(event, callback) {
        if (!events[event]) events[event] = [];
        events[event].push(callback);
      },
      
      off(event, callback) {
        if (!events[event]) return;
        events[event] = events[event].filter(cb => cb !== callback);
      },
      
      emit(event, data) {
        if (!events[event]) return;
        events[event].forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in event callback:', error);
          }
        });
      },
      
      once(event, callback) {
        const onceCallback = (data) => {
          callback(data);
          this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
      }
    };
  }

  // Copy text to clipboard
  static async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          return true;
        } catch (error) {
          console.error('Failed to copy text:', error);
          return false;
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
      return false;
    }
  }

  // Download blob as file
  static downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Generate random ID
  static generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Truncate text with ellipsis
  static truncateText(text, maxLength, ellipsis = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - ellipsis.length) + ellipsis;
  }

  // Strip HTML tags from text
  static stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  // Convert text to HTML with line breaks
  static textToHtml(text) {
    return this.escapeHtml(text).replace(/\n/g, '<br>');
  }

  // Check if device is mobile
  static isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Check if device is touch enabled
  static isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }

  // Simple notification system
  static showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-message">${this.escapeHtml(message)}</span>
      <button class="notification-close">&times;</button>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 12px 16px;
          z-index: 10000;
          max-width: 300px;
          animation: slideIn 0.3s ease;
        }
        .notification-info { border-left: 4px solid #1a73e8; }
        .notification-success { border-left: 4px solid #34a853; }
        .notification-warning { border-left: 4px solid #fbbc04; }
        .notification-error { border-left: 4px solid #ea4335; }
        .notification-close {
          background: none;
          border: none;
          float: right;
          cursor: pointer;
          font-size: 16px;
          margin-left: 10px;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `;
      document.head.appendChild(styles);
    }
    
    // Add close functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, duration);
    }
    
    return notification;
  }

  // Simple loading indicator
  static showLoading(message = 'Loading...') {
    const loading = document.createElement('div');
    loading.id = 'global-loading';
    loading.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
      ">
        <div style="
          background: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        ">
          <div style="margin-bottom: 10px;">
            <i class="fa fa-spinner fa-spin" style="font-size: 24px;"></i>
          </div>
          <div>${this.escapeHtml(message)}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(loading);
    return loading;
  }

  static hideLoading() {
    const loading = document.getElementById('global-loading');
    if (loading) {
      loading.remove();
    }
  }
}

// Make Utils available globally
window.Utils = Utils;