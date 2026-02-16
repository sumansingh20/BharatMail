// Email viewer component for displaying individual emails
class EmailViewer {
  constructor() {
    this.element = this.createElement();
    this.currentEmail = null;
  }

  createElement() {
    const viewer = document.createElement('div');
    viewer.className = 'email-viewer';
    viewer.innerHTML = `
      <div class="email-viewer-header">
        <div class="email-actions">
          <button class="btn-icon" id="back-btn" title="Back to list">
            <i class="fa fa-arrow-left"></i>
          </button>
          <button class="btn-icon" id="reply-btn" title="Reply">
            <i class="fa fa-reply"></i>
          </button>
          <button class="btn-icon" id="reply-all-btn" title="Reply all">
            <i class="fa fa-reply-all"></i>
          </button>
          <button class="btn-icon" id="forward-btn" title="Forward">
            <i class="fa fa-share"></i>
          </button>
          <button class="btn-icon" id="star-email-btn" title="Star">
            <i class="fa fa-star-o"></i>
          </button>
          <button class="btn-icon" id="delete-email-btn" title="Delete">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </div>

      <div class="email-content">
        <div class="loading" style="display: none;">
          <i class="fa fa-spinner fa-spin"></i>
          Loading email...
        </div>

        <div class="email-details" style="display: none;">
          <div class="email-header">
            <h2 class="email-subject"></h2>
            
            <div class="email-meta">
              <div class="sender-info">
                <div class="sender-avatar">
                  <i class="fa fa-user"></i>
                </div>
                <div class="sender-details">
                  <div class="sender-name"></div>
                  <div class="sender-email"></div>
                </div>
              </div>
              
              <div class="email-timestamp"></div>
            </div>

            <div class="recipients" style="display: none;">
              <div class="recipient-row">
                <span class="label">To:</span>
                <span class="recipients-list to-recipients"></span>
              </div>
              <div class="recipient-row cc-row" style="display: none;">
                <span class="label">CC:</span>
                <span class="recipients-list cc-recipients"></span>
              </div>
              <div class="recipient-row bcc-row" style="display: none;">
                <span class="label">BCC:</span>
                <span class="recipients-list bcc-recipients"></span>
              </div>
            </div>

            <div class="attachments-section" style="display: none;">
              <div class="attachments-header">
                <i class="fa fa-paperclip"></i>
                <span class="attachment-count"></span>
              </div>
              <div class="attachments-list"></div>
            </div>
          </div>

          <div class="email-body">
            <div class="email-text"></div>
          </div>
        </div>

        <div class="no-email-selected">
          <i class="fa fa-envelope-o fa-3x"></i>
          <h3>Select an email to view</h3>
          <p>Choose an email from the list to read its contents</p>
        </div>
      </div>
    `;
    return viewer;
  }

  setupEventListeners() {
    // Back button
    this.element.querySelector('#back-btn').addEventListener('click', () => {
      this.hide();
      window.emailApp.showEmailList();
    });

    // Reply button
    this.element.querySelector('#reply-btn').addEventListener('click', () => {
      if (this.currentEmail) {
        window.emailApp.showComposeDialog('reply', this.currentEmail);
      }
    });

    // Reply all button
    this.element.querySelector('#reply-all-btn').addEventListener('click', () => {
      if (this.currentEmail) {
        window.emailApp.showComposeDialog('replyAll', this.currentEmail);
      }
    });

    // Forward button
    this.element.querySelector('#forward-btn').addEventListener('click', () => {
      if (this.currentEmail) {
        window.emailApp.showComposeDialog('forward', this.currentEmail);
      }
    });

    // Star button
    this.element.querySelector('#star-email-btn').addEventListener('click', () => {
      if (this.currentEmail) {
        this.toggleStar();
      }
    });

    // Delete button
    this.element.querySelector('#delete-email-btn').addEventListener('click', () => {
      if (this.currentEmail) {
        this.deleteEmail();
      }
    });
  }

  async loadEmail(emailId) {
    this.showLoading(true);
    
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        headers: {
          'Authorization': `Bearer ${window.authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load email');
      }

      this.currentEmail = await response.json();
      this.renderEmail();
      
      // Mark as read if unread
      if (!this.currentEmail.is_read) {
        this.markAsRead();
      }
      
    } catch (error) {
      console.error('Error loading email:', error);
      this.showError('Failed to load email');
    } finally {
      this.showLoading(false);
    }
  }

  renderEmail() {
    if (!this.currentEmail) return;

    const email = this.currentEmail;
    
    // Update subject
    this.element.querySelector('.email-subject').textContent = email.subject || '(no subject)';
    
    // Update sender info
    this.element.querySelector('.sender-name').textContent = email.sender_name || email.sender_email;
    this.element.querySelector('.sender-email').textContent = email.sender_email;
    
    // Update timestamp
    const timestamp = new Date(email.received_at);
    this.element.querySelector('.email-timestamp').textContent = this.formatDateTime(timestamp);
    
    // Update recipients
    this.renderRecipients(email);
    
    // Update attachments
    this.renderAttachments(email.attachments || []);
    
    // Update email body
    this.renderEmailBody(email.body_text, email.body_html);
    
    // Update star button
    const starBtn = this.element.querySelector('#star-email-btn i');
    starBtn.className = email.is_starred ? 'fa fa-star' : 'fa fa-star-o';
    
    // Show email details
    this.element.querySelector('.email-details').style.display = 'block';
    this.element.querySelector('.no-email-selected').style.display = 'none';
  }

  renderRecipients(email) {
    const recipientsSection = this.element.querySelector('.recipients');
    const toRecipients = this.element.querySelector('.to-recipients');
    const ccRecipients = this.element.querySelector('.cc-recipients');
    const bccRecipients = this.element.querySelector('.bcc-recipients');
    
    // Parse recipients
    const to = email.to_addresses ? email.to_addresses.split(',') : [];
    const cc = email.cc_addresses ? email.cc_addresses.split(',') : [];
    const bcc = email.bcc_addresses ? email.bcc_addresses.split(',') : [];
    
    if (to.length > 0 || cc.length > 0 || bcc.length > 0) {
      recipientsSection.style.display = 'block';
      
      toRecipients.textContent = to.join(', ');
      
      if (cc.length > 0) {
        this.element.querySelector('.cc-row').style.display = 'block';
        ccRecipients.textContent = cc.join(', ');
      } else {
        this.element.querySelector('.cc-row').style.display = 'none';
      }
      
      if (bcc.length > 0) {
        this.element.querySelector('.bcc-row').style.display = 'block';
        bccRecipients.textContent = bcc.join(', ');
      } else {
        this.element.querySelector('.bcc-row').style.display = 'none';
      }
    } else {
      recipientsSection.style.display = 'none';
    }
  }

  renderAttachments(attachments) {
    const attachmentsSection = this.element.querySelector('.attachments-section');
    const attachmentsList = this.element.querySelector('.attachments-list');
    const attachmentCount = this.element.querySelector('.attachment-count');
    
    if (attachments.length > 0) {
      attachmentsSection.style.display = 'block';
      attachmentCount.textContent = `${attachments.length} attachment${attachments.length !== 1 ? 's' : ''}`;
      
      attachmentsList.innerHTML = attachments.map(attachment => `
        <div class="attachment-item">
          <i class="fa fa-file"></i>
          <span class="attachment-name">${this.escapeHtml(attachment.filename)}</span>
          <span class="attachment-size">(${this.formatFileSize(attachment.size)})</span>
          <button class="download-btn" data-attachment-id="${attachment.id}">
            <i class="fa fa-download"></i>
          </button>
        </div>
      `).join('');
      
      // Add download event listeners
      attachmentsList.addEventListener('click', (e) => {
        const downloadBtn = e.target.closest('.download-btn');
        if (downloadBtn) {
          const attachmentId = downloadBtn.dataset.attachmentId;
          this.downloadAttachment(attachmentId);
        }
      });
    } else {
      attachmentsSection.style.display = 'none';
    }
  }

  renderEmailBody(textBody, htmlBody) {
    const emailText = this.element.querySelector('.email-text');
    
    if (htmlBody) {
      emailText.innerHTML = this.sanitizeHtml(htmlBody);
    } else if (textBody) {
      emailText.innerHTML = this.escapeHtml(textBody).replace(/\n/g, '<br>');
    } else {
      emailText.innerHTML = '<em>No content</em>';
    }
  }

  formatDateTime(date) {
    const now = new Date();
    const diff = now - date;
    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (daysDiff === 1) {
      return 'Yesterday';
    } else if (daysDiff < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString();
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  sanitizeHtml(html) {
    // Basic HTML sanitization - in production, use a proper sanitization library
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Remove script tags and other dangerous elements
    const scripts = div.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    return div.innerHTML;
  }

  async toggleStar() {
    if (!this.currentEmail) return;

    try {
      const response = await fetch(`/api/emails/${this.currentEmail.id}/star`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.authService.getToken()}`
        }
      });

      if (response.ok) {
        this.currentEmail.is_starred = !this.currentEmail.is_starred;
        const starBtn = this.element.querySelector('#star-email-btn i');
        starBtn.className = this.currentEmail.is_starred ? 'fa fa-star' : 'fa fa-star-o';
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  }

  async markAsRead() {
    if (!this.currentEmail) return;

    try {
      await fetch(`/api/emails/${this.currentEmail.id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.authService.getToken()}`
        }
      });
      
      this.currentEmail.is_read = true;
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  async deleteEmail() {
    if (!this.currentEmail) return;

    if (!confirm('Delete this email?')) return;

    try {
      const response = await fetch(`/api/emails/${this.currentEmail.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${window.authService.getToken()}`
        }
      });

      if (response.ok) {
        this.hide();
        window.emailApp.showEmailList();
        window.emailApp.refreshEmailList();
      }
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  }

  async downloadAttachment(attachmentId) {
    try {
      const response = await fetch(`/api/emails/attachments/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${window.authService.getToken()}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attachment_${attachmentId}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  }

  showLoading(show) {
    const loading = this.element.querySelector('.loading');
    const details = this.element.querySelector('.email-details');
    const noEmail = this.element.querySelector('.no-email-selected');
    
    loading.style.display = show ? 'flex' : 'none';
    details.style.display = show ? 'none' : (this.currentEmail ? 'block' : 'none');
    noEmail.style.display = show || this.currentEmail ? 'none' : 'block';
  }

  showError(message) {
    console.error(message);
    alert(message); // Simple error display for now
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
    this.currentEmail = null;
    this.element.querySelector('.email-details').style.display = 'none';
    this.element.querySelector('.no-email-selected').style.display = 'block';
  }

  render(container) {
    container.appendChild(this.element);
    this.setupEventListeners();
  }
}

// Export for use in other modules
window.EmailViewer = EmailViewer;