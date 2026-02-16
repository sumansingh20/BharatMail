// Email list component for displaying emails in folders
class EmailList {
  constructor() {
    this.element = this.createElement();
    this.emails = [];
    this.selectedEmails = new Set();
    this.currentFolder = 'inbox';
  }

  createElement() {
    const emailList = document.createElement('div');
    emailList.className = 'email-list';
    emailList.innerHTML = `
      <div class="email-list-header">
        <div class="toolbar">
          <div class="select-actions">
            <input type="checkbox" id="select-all" class="select-all-checkbox">
            <button class="btn-icon" id="refresh-btn" title="Refresh">
              <i class="fa fa-refresh"></i>
            </button>
          </div>
          
          <div class="bulk-actions" style="display: none;">
            <button class="btn-icon" id="mark-read-btn" title="Mark as read">
              <i class="fa fa-envelope-open"></i>
            </button>
            <button class="btn-icon" id="mark-unread-btn" title="Mark as unread">
              <i class="fa fa-envelope"></i>
            </button>
            <button class="btn-icon" id="star-btn" title="Add star">
              <i class="fa fa-star"></i>
            </button>
            <button class="btn-icon" id="delete-btn" title="Delete">
              <i class="fa fa-trash"></i>
            </button>
          </div>

          <div class="view-options">
            <span class="email-count">0 emails</span>
          </div>
        </div>
      </div>

      <div class="email-list-content">
        <div class="loading" style="display: none;">
          <i class="fa fa-spinner fa-spin"></i>
          Loading emails...
        </div>
        
        <div class="empty-state" style="display: none;">
          <i class="fa fa-inbox fa-3x"></i>
          <h3>No emails in this folder</h3>
          <p>Your folder is empty</p>
        </div>

        <div class="emails-container"></div>
      </div>
    `;
    return emailList;
  }

  setupEventListeners() {
    // Select all checkbox
    const selectAllCheckbox = this.element.querySelector('#select-all');
    selectAllCheckbox.addEventListener('change', (e) => {
      this.selectAll(e.target.checked);
    });

    // Bulk action buttons
    this.element.querySelector('#mark-read-btn').addEventListener('click', () => {
      this.markSelectedAsRead(true);
    });

    this.element.querySelector('#mark-unread-btn').addEventListener('click', () => {
      this.markSelectedAsRead(false);
    });

    this.element.querySelector('#star-btn').addEventListener('click', () => {
      this.toggleStarSelected();
    });

    this.element.querySelector('#delete-btn').addEventListener('click', () => {
      this.deleteSelected();
    });

    this.element.querySelector('#refresh-btn').addEventListener('click', () => {
      this.refresh();
    });

    // Email item event delegation
    this.element.addEventListener('click', (e) => {
      const emailItem = e.target.closest('.email-item');
      if (!emailItem) return;

      const emailId = parseInt(emailItem.dataset.emailId);
      
      if (e.target.type === 'checkbox') {
        this.toggleEmailSelection(emailId, e.target.checked);
      } else if (e.target.closest('.star-btn')) {
        e.stopPropagation();
        this.toggleStar(emailId);
      } else {
        this.openEmail(emailId);
      }
    });
  }

  async loadEmails(folder = 'inbox') {
    this.currentFolder = folder;
    this.showLoading(true);
    
    try {
      const response = await fetch(`/api/emails/folder/${folder}`, {
        headers: {
          'Authorization': `Bearer ${window.authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load emails');
      }

      this.emails = await response.json();
      this.renderEmails();
      this.updateEmailCount();
      
    } catch (error) {
      console.error('Error loading emails:', error);
      this.showError('Failed to load emails');
    } finally {
      this.showLoading(false);
    }
  }

  renderEmails() {
    const container = this.element.querySelector('.emails-container');
    const emptyState = this.element.querySelector('.empty-state');

    if (this.emails.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = this.emails.map(email => this.createEmailHTML(email)).join('');
  }

  createEmailHTML(email) {
    const isUnread = !email.is_read;
    const isStarred = email.is_starred;
    const formattedDate = new Date(email.received_at).toLocaleDateString();

    return `
      <div class="email-item ${isUnread ? 'unread' : ''}" data-email-id="${email.id}">
        <div class="email-checkbox">
          <input type="checkbox" class="email-select">
        </div>
        
        <div class="email-star">
          <button class="star-btn ${isStarred ? 'starred' : ''}">
            <i class="fa ${isStarred ? 'fa-star' : 'fa-star-o'}"></i>
          </button>
        </div>

        <div class="email-sender">
          ${this.escapeHtml(email.sender_name || email.sender_email)}
        </div>

        <div class="email-subject">
          <span class="subject-text">${this.escapeHtml(email.subject || '(no subject)')}</span>
          ${email.has_attachments ? '<i class="fa fa-paperclip attachment-icon"></i>' : ''}
        </div>

        <div class="email-date">
          ${formattedDate}
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  toggleEmailSelection(emailId, selected) {
    if (selected) {
      this.selectedEmails.add(emailId);
    } else {
      this.selectedEmails.delete(emailId);
    }
    
    this.updateBulkActions();
    this.updateSelectAllCheckbox();
  }

  selectAll(selected) {
    const checkboxes = this.element.querySelectorAll('.email-select');
    checkboxes.forEach(checkbox => {
      checkbox.checked = selected;
      const emailId = parseInt(checkbox.closest('.email-item').dataset.emailId);
      this.toggleEmailSelection(emailId, selected);
    });
  }

  updateBulkActions() {
    const bulkActions = this.element.querySelector('.bulk-actions');
    bulkActions.style.display = this.selectedEmails.size > 0 ? 'flex' : 'none';
  }

  updateSelectAllCheckbox() {
    const selectAllCheckbox = this.element.querySelector('#select-all');
    const totalEmails = this.emails.length;
    const selectedCount = this.selectedEmails.size;
    
    selectAllCheckbox.checked = selectedCount === totalEmails && totalEmails > 0;
    selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalEmails;
  }

  updateEmailCount() {
    const countElement = this.element.querySelector('.email-count');
    const count = this.emails.length;
    countElement.textContent = `${count} email${count !== 1 ? 's' : ''}`;
  }

  showLoading(show) {
    const loading = this.element.querySelector('.loading');
    loading.style.display = show ? 'flex' : 'none';
  }

  showError(message) {
    // You can implement a toast notification or error display here
    console.error(message);
    alert(message); // Simple error display for now
  }

  async toggleStar(emailId) {
    try {
      const response = await fetch(`/api/emails/${emailId}/star`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.authService.getToken()}`
        }
      });

      if (response.ok) {
        // Update local email data and re-render
        const email = this.emails.find(e => e.id === emailId);
        if (email) {
          email.is_starred = !email.is_starred;
          this.renderEmails();
        }
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  }

  async markSelectedAsRead(isRead) {
    if (this.selectedEmails.size === 0) return;

    try {
      const emailIds = Array.from(this.selectedEmails);
      const response = await fetch('/api/emails/bulk/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.authService.getToken()}`
        },
        body: JSON.stringify({ emailIds, isRead })
      });

      if (response.ok) {
        this.refresh();
      }
    } catch (error) {
      console.error('Error updating read status:', error);
    }
  }

  async deleteSelected() {
    if (this.selectedEmails.size === 0) return;

    if (!confirm(`Delete ${this.selectedEmails.size} email(s)?`)) return;

    try {
      const emailIds = Array.from(this.selectedEmails);
      const response = await fetch('/api/emails/bulk/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.authService.getToken()}`
        },
        body: JSON.stringify({ emailIds })
      });

      if (response.ok) {
        this.selectedEmails.clear();
        this.refresh();
      }
    } catch (error) {
      console.error('Error deleting emails:', error);
    }
  }

  openEmail(emailId) {
    window.emailApp.openEmail(emailId);
  }

  refresh() {
    this.selectedEmails.clear();
    this.loadEmails(this.currentFolder);
  }

  render(container) {
    container.appendChild(this.element);
    this.setupEventListeners();
  }
}

// Export for use in other modules
window.EmailList = EmailList;