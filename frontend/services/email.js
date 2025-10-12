// Email service for handling email-related API calls
class EmailService {
  constructor() {
    this.baseUrl = '/api/emails';
  }

  // Get emails by folder
  async getEmailsByFolder(folder = 'inbox', page = 1, limit = 50) {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/folder/${folder}?page=${page}&limit=${limit}`
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to load emails');
      }
    } catch (error) {
      console.error('Error loading emails:', error);
      throw error;
    }
  }

  // Get single email by ID
  async getEmailById(emailId) {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/${emailId}`
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to load email');
      }
    } catch (error) {
      console.error('Error loading email:', error);
      throw error;
    }
  }

  // Send new email
  async sendEmail(emailData) {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailData)
        }
      );

      if (response.ok) {
        return await response.json();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Save draft
  async saveDraft(draftData, draftId = null) {
    try {
      const url = draftId ? `${this.baseUrl}/draft/${draftId}` : `${this.baseUrl}/draft`;
      const method = draftId ? 'PUT' : 'POST';

      const response = await window.authService.authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(draftData)
      });

      if (response.ok) {
        return await response.json();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  // Mark email as read/unread
  async markAsRead(emailId, isRead = true) {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/${emailId}/read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isRead })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error marking email as read:', error);
      return false;
    }
  }

  // Toggle star status
  async toggleStar(emailId) {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/${emailId}/star`,
        {
          method: 'POST'
        }
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to toggle star');
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      throw error;
    }
  }

  // Delete email(s)
  async deleteEmail(emailId) {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/${emailId}`,
        {
          method: 'DELETE'
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting email:', error);
      return false;
    }
  }

  // Bulk operations
  async bulkMarkAsRead(emailIds, isRead = true) {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/bulk/read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ emailIds, isRead })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error bulk marking as read:', error);
      return false;
    }
  }

  async bulkDelete(emailIds) {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/bulk/delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ emailIds })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error bulk deleting emails:', error);
      return false;
    }
  }

  async bulkStar(emailIds, isStarred = true) {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/bulk/star`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ emailIds, isStarred })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error bulk starring emails:', error);
      return false;
    }
  }

  // Move emails to folder
  async moveToFolder(emailIds, folder) {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/move`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ emailIds, folder })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error moving emails:', error);
      return false;
    }
  }

  // Search emails
  async searchEmails(query, folder = null, page = 1, limit = 50) {
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString()
      });

      if (folder) {
        params.set('folder', folder);
      }

      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/search?${params.toString()}`
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  // Get folder counts (unread count, etc.)
  async getFolderCounts() {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/counts`
      );

      if (response.ok) {
        return await response.json();
      } else {
        return {};
      }
    } catch (error) {
      console.error('Error loading folder counts:', error);
      return {};
    }
  }

  // Download attachment
  async downloadAttachment(attachmentId) {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/attachments/${attachmentId}`
      );

      if (response.ok) {
        return response.blob();
      } else {
        throw new Error('Failed to download attachment');
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
      throw error;
    }
  }

  // Get email thread
  async getEmailThread(emailId) {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/${emailId}/thread`
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to load thread');
      }
    } catch (error) {
      console.error('Error loading thread:', error);
      throw error;
    }
  }

  // Archive emails
  async archiveEmails(emailIds) {
    return this.moveToFolder(emailIds, 'archive');
  }

  // Unarchive emails (move back to inbox)
  async unarchiveEmails(emailIds) {
    return this.moveToFolder(emailIds, 'inbox');
  }

  // Move to spam
  async markAsSpam(emailIds) {
    return this.moveToFolder(emailIds, 'spam');
  }

  // Move from spam to inbox
  async markAsNotSpam(emailIds) {
    return this.moveToFolder(emailIds, 'inbox');
  }

  // Empty trash
  async emptyTrash() {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/trash/empty`,
        {
          method: 'POST'
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error emptying trash:', error);
      return false;
    }
  }

  // Sync emails (fetch new emails from IMAP server)
  async syncEmails() {
    try {
      const response = await window.authService.authenticatedFetch(
        `${this.baseUrl}/sync`,
        {
          method: 'POST'
        }
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Error syncing emails:', error);
      throw error;
    }
  }

  // Get IMAP/SMTP settings
  async getEmailSettings() {
    try {
      const response = await window.authService.authenticatedFetch(
        '/api/settings/email'
      );

      if (response.ok) {
        return await response.json();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
      return null;
    }
  }

  // Update IMAP/SMTP settings
  async updateEmailSettings(settings) {
    try {
      const response = await window.authService.authenticatedFetch(
        '/api/settings/email',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settings)
        }
      );

      if (response.ok) {
        return await response.json();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating email settings:', error);
      throw error;
    }
  }

  // Test email connection
  async testEmailConnection(settings) {
    try {
      const response = await window.authService.authenticatedFetch(
        '/api/settings/email/test',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settings)
        }
      );

      if (response.ok) {
        return await response.json();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Error testing email connection:', error);
      throw error;
    }
  }
}

// Create global email service instance
window.emailService = new EmailService();