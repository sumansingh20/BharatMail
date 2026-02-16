// Authentication service for handling login/logout
class AuthService {
    static async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: error.message || 'Network error. Please try again.'
            };
        }
    }

    static async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                error: error.message || 'Network error. Please try again.'
            };
        }
    }

    static async verifyToken(token) {
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }

    static async logout() {
        try {
            const token = localStorage.getItem('authToken');
            
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            
            localStorage.removeItem('authToken');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('authToken'); // Remove token anyway
            return { success: true }; // Always succeed for logout
        }
    }

    static getToken() {
        return localStorage.getItem('authToken');
    }

    static isAuthenticated() {
        return !!this.getToken();
    }
}

// API service for general API calls
class ApiService {
    static getBaseUrl() {
        return window.location.origin + '/api';
    }

    static getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = AuthService.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    static async request(endpoint, options = {}) {
        const url = this.getBaseUrl() + endpoint;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('authToken');
                if (window.app) {
                    window.app.logout();
                }
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Network error' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    static async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    static async post(endpoint, data = null) {
        return this.request(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        });
    }

    static async put(endpoint, data = null) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        });
    }

    static async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    static async upload(endpoint, formData) {
        const token = AuthService.getToken();
        const headers = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(this.getBaseUrl() + endpoint, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Upload failed' }));
                throw new Error(error.message);
            }

            return await response.json();
        } catch (error) {
            console.error(`Upload failed: ${endpoint}`, error);
            throw error;
        }
    }
}

// Email service for email-specific operations
class EmailService {
    static async getEmailsByFolder(folder, page = 1, limit = 50) {
        return ApiService.get(`/emails?folder=${folder}&page=${page}&limit=${limit}`);
    }

    static async getEmailById(id) {
        return ApiService.get(`/emails/${id}`);
    }

    static async sendEmail(emailData) {
        return ApiService.post('/emails/send', emailData);
    }

    static async saveDraft(emailData) {
        return ApiService.post('/emails/draft', emailData);
    }

    static async updateDraft(id, emailData) {
        return ApiService.put(`/emails/draft/${id}`, emailData);
    }

    static async searchEmails(query, filters = {}) {
        const params = new URLSearchParams({
            q: query,
            ...filters
        });
        
        return ApiService.get(`/emails/search?${params}`);
    }

    static async markAsRead(emailIds) {
        return ApiService.post('/emails/mark-read', { emailIds });
    }

    static async markAsUnread(emailIds) {
        return ApiService.post('/emails/mark-unread', { emailIds });
    }

    static async markAsStarred(emailIds) {
        return ApiService.post('/emails/mark-starred', { emailIds });
    }

    static async markAsUnstarred(emailIds) {
        return ApiService.post('/emails/mark-unstarred', { emailIds });
    }

    static async markAsImportant(emailIds) {
        return ApiService.post('/emails/mark-important', { emailIds });
    }

    static async deleteEmails(emailIds) {
        return ApiService.post('/emails/delete', { emailIds });
    }

    static async restoreEmails(emailIds) {
        return ApiService.post('/emails/restore', { emailIds });
    }

    static async archiveEmails(emailIds) {
        return ApiService.post('/emails/archive', { emailIds });
    }

    static async moveToFolder(emailIds, folder) {
        return ApiService.post('/emails/move', { emailIds, folder });
    }

    static async addLabel(emailIds, labelId) {
        return ApiService.post('/emails/add-label', { emailIds, labelId });
    }

    static async removeLabel(emailIds, labelId) {
        return ApiService.post('/emails/remove-label', { emailIds, labelId });
    }

    static async snoozeEmails(emailIds, snoozeUntil) {
        return ApiService.post('/emails/snooze', { emailIds, snoozeUntil });
    }

    static async unsnoozeEmails(emailIds) {
        return ApiService.post('/emails/unsnooze', { emailIds });
    }

    static async reportSpam(emailIds) {
        return ApiService.post('/emails/report-spam', { emailIds });
    }

    static async blockSender(email) {
        return ApiService.post('/emails/block-sender', { email });
    }

    static async getAttachment(emailId, attachmentId) {
        const response = await fetch(`${ApiService.getBaseUrl()}/emails/${emailId}/attachments/${attachmentId}`, {
            headers: ApiService.getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to download attachment');
        }

        return response.blob();
    }
}

// Contact service for contact management
class ContactService {
    static async getContacts(search = '', page = 1, limit = 100) {
        const params = new URLSearchParams({ search, page, limit });
        return ApiService.get(`/contacts?${params}`);
    }

    static async getContactById(id) {
        return ApiService.get(`/contacts/${id}`);
    }

    static async createContact(contactData) {
        return ApiService.post('/contacts', contactData);
    }

    static async updateContact(id, contactData) {
        return ApiService.put(`/contacts/${id}`, contactData);
    }

    static async deleteContact(id) {
        return ApiService.delete(`/contacts/${id}`);
    }

    static async getFrequentContacts() {
        return ApiService.get('/contacts/frequent');
    }

    static async searchContacts(query) {
        return ApiService.get(`/contacts/search?q=${encodeURIComponent(query)}`);
    }
}

// Label service for label management
class LabelService {
    static async getLabels() {
        return ApiService.get('/labels');
    }

    static async createLabel(labelData) {
        return ApiService.post('/labels', labelData);
    }

    static async updateLabel(id, labelData) {
        return ApiService.put(`/labels/${id}`, labelData);
    }

    static async deleteLabel(id) {
        return ApiService.delete(`/labels/${id}`);
    }
}

// Settings service for user preferences
class SettingsService {
    static async getSettings() {
        return ApiService.get('/settings');
    }

    static async updateSettings(settings) {
        return ApiService.put('/settings', settings);
    }

    static async getFilters() {
        return ApiService.get('/settings/filters');
    }

    static async createFilter(filterData) {
        return ApiService.post('/settings/filters', filterData);
    }

    static async updateFilter(id, filterData) {
        return ApiService.put(`/settings/filters/${id}`, filterData);
    }

    static async deleteFilter(id) {
        return ApiService.delete(`/settings/filters/${id}`);
    }

    static async getTemplates() {
        return ApiService.get('/settings/templates');
    }

    static async createTemplate(templateData) {
        return ApiService.post('/settings/templates', templateData);
    }

    static async updateTemplate(id, templateData) {
        return ApiService.put(`/settings/templates/${id}`, templateData);
    }

    static async deleteTemplate(id) {
        return ApiService.delete(`/settings/templates/${id}`);
    }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AuthService,
        ApiService,
        EmailService,
        ContactService,
        LabelService,
        SettingsService
    };
}