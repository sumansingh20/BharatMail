// Compose dialog component for creating new emails
class ComposeDialog {
  constructor() {
    this.element = this.createElement();
    this.mode = 'compose'; // compose, reply, replyAll, forward
    this.originalEmail = null;
    this.isDraft = false;
    this.draftId = null;
  }

  createElement() {
    const dialog = document.createElement('div');
    dialog.className = 'compose-dialog-overlay';
    dialog.innerHTML = `
      <div class="compose-dialog">
        <div class="compose-header">
          <h3 class="compose-title">New Message</h3>
          <div class="compose-actions">
            <button class="btn-icon" id="minimize-btn" title="Minimize">
              <i class="fa fa-minus"></i>
            </button>
            <button class="btn-icon" id="close-btn" title="Close">
              <i class="fa fa-times"></i>
            </button>
          </div>
        </div>

        <div class="compose-body">
          <form class="compose-form">
            <div class="recipient-field">
              <label>To:</label>
              <input type="email" id="to-field" class="recipient-input" multiple>
              <div class="recipient-suggestions" style="display: none;"></div>
            </div>

            <div class="recipient-field cc-field" style="display: none;">
              <label>CC:</label>
              <input type="email" id="cc-field" class="recipient-input" multiple>
            </div>

            <div class="recipient-field bcc-field" style="display: none;">
              <label>BCC:</label>
              <input type="email" id="bcc-field" class="recipient-input" multiple>
            </div>

            <div class="recipient-toggle">
              <button type="button" class="link-btn" id="show-cc-bcc">CC/BCC</button>
            </div>

            <div class="subject-field">
              <label>Subject:</label>
              <input type="text" id="subject-field" class="subject-input">
            </div>

            <div class="compose-toolbar">
              <div class="formatting-tools">
                <button type="button" class="btn-icon" id="bold-btn" title="Bold">
                  <i class="fa fa-bold"></i>
                </button>
                <button type="button" class="btn-icon" id="italic-btn" title="Italic">
                  <i class="fa fa-italic"></i>
                </button>
                <button type="button" class="btn-icon" id="underline-btn" title="Underline">
                  <i class="fa fa-underline"></i>
                </button>
                <span class="separator">|</span>
                <button type="button" class="btn-icon" id="link-btn" title="Insert link">
                  <i class="fa fa-link"></i>
                </button>
                <button type="button" class="btn-icon" id="attach-btn" title="Attach files">
                  <i class="fa fa-paperclip"></i>
                </button>
              </div>

              <div class="send-options">
                <button type="button" class="btn-secondary" id="save-draft-btn">
                  <i class="fa fa-save"></i>
                  Save Draft
                </button>
                <button type="submit" class="btn-primary" id="send-btn">
                  <i class="fa fa-paper-plane"></i>
                  Send
                </button>
              </div>
            </div>

            <div class="attachments-area" style="display: none;">
              <div class="attachments-list"></div>
            </div>

            <div class="message-field">
              <div id="message-editor" class="message-editor" contenteditable="true" 
                   placeholder="Compose your message...">
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
    return dialog;
  }

  setupEventListeners() {
    // Close and minimize buttons
    this.element.querySelector('#close-btn').addEventListener('click', () => {
      this.close();
    });

    this.element.querySelector('#minimize-btn').addEventListener('click', () => {
      this.minimize();
    });

    // Click outside to close
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });

    // CC/BCC toggle
    this.element.querySelector('#show-cc-bcc').addEventListener('click', () => {
      this.toggleCcBcc();
    });

    // Form submission
    this.element.querySelector('.compose-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendEmail();
    });

    // Save draft
    this.element.querySelector('#save-draft-btn').addEventListener('click', () => {
      this.saveDraft();
    });

    // Formatting buttons
    this.element.querySelector('#bold-btn').addEventListener('click', () => {
      document.execCommand('bold');
    });

    this.element.querySelector('#italic-btn').addEventListener('click', () => {
      document.execCommand('italic');
    });

    this.element.querySelector('#underline-btn').addEventListener('click', () => {
      document.execCommand('underline');
    });

    this.element.querySelector('#link-btn').addEventListener('click', () => {
      this.insertLink();
    });

    this.element.querySelector('#attach-btn').addEventListener('click', () => {
      this.attachFiles();
    });

    // Auto-save draft periodically
    this.setupAutoSave();

    // Recipient validation
    this.setupRecipientValidation();
  }

  show(mode = 'compose', originalEmail = null, realEmailMode = false) {
    this.mode = mode;
    this.originalEmail = originalEmail;
    this.realEmailMode = realEmailMode;
    
    this.updateTitle();
    this.populateFields();
    this.updateSendButton();
    this.element.style.display = 'flex';
    
    // Focus on the first empty field
    this.focusFirstField();
  }

  hide() {
    this.element.style.display = 'none';
  }

  close() {
    const hasContent = this.hasUnsavedContent();
    
    if (hasContent) {
      const save = confirm('Save this message as a draft?');
      if (save) {
        this.saveDraft();
      }
    }
    
    this.hide();
    this.reset();
  }

  minimize() {
    // Add minimized state - could be implemented as a small floating compose window
    this.element.classList.add('minimized');
  }

  updateTitle() {
    const titleElement = this.element.querySelector('.compose-title');
    
    switch (this.mode) {
      case 'reply':
        titleElement.textContent = 'Reply';
        break;
      case 'replyAll':
        titleElement.textContent = 'Reply All';
        break;
      case 'forward':
        titleElement.textContent = 'Forward';
        break;
      default:
        titleElement.textContent = this.realEmailMode ? 'New Real Email' : 'New Message';
    }
  }

  updateSendButton() {
    const sendBtn = this.element.querySelector('#send-btn');
    if (this.realEmailMode) {
      sendBtn.innerHTML = '<i class="fa fa-send"></i> Send Real Email';
      sendBtn.style.background = '#ea4335'; // Red color for real email
      sendBtn.title = 'This will send an actual email through your configured email account';
    } else {
      sendBtn.innerHTML = '<i class="fa fa-send"></i> Send';
      sendBtn.style.background = '#1a73e8'; // Blue color for local email
      sendBtn.title = 'Send email within BhaMail';
    }
  }

  populateFields() {
    if (!this.originalEmail) return;

    const toField = this.element.querySelector('#to-field');
    const ccField = this.element.querySelector('#cc-field');
    const subjectField = this.element.querySelector('#subject-field');
    const messageEditor = this.element.querySelector('#message-editor');

    switch (this.mode) {
      case 'reply':
        toField.value = this.originalEmail.sender_email;
        subjectField.value = this.getReplySubject(this.originalEmail.subject);
        messageEditor.innerHTML = this.getReplyBody(this.originalEmail);
        break;

      case 'replyAll':
        const allRecipients = this.getAllRecipients(this.originalEmail);
        toField.value = allRecipients.to.join(', ');
        if (allRecipients.cc.length > 0) {
          this.toggleCcBcc(true);
          ccField.value = allRecipients.cc.join(', ');
        }
        subjectField.value = this.getReplySubject(this.originalEmail.subject);
        messageEditor.innerHTML = this.getReplyBody(this.originalEmail);
        break;

      case 'forward':
        subjectField.value = this.getForwardSubject(this.originalEmail.subject);
        messageEditor.innerHTML = this.getForwardBody(this.originalEmail);
        break;
    }
  }

  getReplySubject(originalSubject) {
    if (!originalSubject) return 'Re: ';
    return originalSubject.startsWith('Re: ') ? originalSubject : `Re: ${originalSubject}`;
  }

  getForwardSubject(originalSubject) {
    if (!originalSubject) return 'Fwd: ';
    return originalSubject.startsWith('Fwd: ') ? originalSubject : `Fwd: ${originalSubject}`;
  }

  getReplyBody(email) {
    const timestamp = new Date(email.received_at).toLocaleString();
    const originalBody = email.body_html || email.body_text || '';
    
    return `
      <br><br>
      <div class="quoted-email">
        <div class="quote-header">
          On ${timestamp}, ${email.sender_name || email.sender_email} wrote:
        </div>
        <blockquote style="margin-left: 20px; padding-left: 10px; border-left: 2px solid #ccc;">
          ${originalBody}
        </blockquote>
      </div>
    `;
  }

  getForwardBody(email) {
    const timestamp = new Date(email.received_at).toLocaleString();
    const originalBody = email.body_html || email.body_text || '';
    
    return `
      <br><br>
      <div class="forwarded-email">
        <div class="forward-header">
          ---------- Forwarded message ----------<br>
          From: ${email.sender_name || email.sender_email} &lt;${email.sender_email}&gt;<br>
          Date: ${timestamp}<br>
          Subject: ${email.subject || '(no subject)'}<br>
          To: ${email.to_addresses || ''}
        </div>
        <br>
        <div class="forward-body">
          ${originalBody}
        </div>
      </div>
    `;
  }

  getAllRecipients(email) {
    const to = email.to_addresses ? email.to_addresses.split(',').map(e => e.trim()) : [];
    const cc = email.cc_addresses ? email.cc_addresses.split(',').map(e => e.trim()) : [];
    
    // Add original sender to recipients (but exclude current user)
    if (email.sender_email && !this.isCurrentUser(email.sender_email)) {
      to.unshift(email.sender_email);
    }
    
    return { to, cc };
  }

  isCurrentUser(email) {
    // Get current user email from auth service
    const currentUser = window.authService.getCurrentUser();
    return currentUser && currentUser.email === email;
  }

  toggleCcBcc(show = null) {
    const ccField = this.element.querySelector('.cc-field');
    const bccField = this.element.querySelector('.bcc-field');
    const toggleBtn = this.element.querySelector('#show-cc-bcc');
    
    const shouldShow = show !== null ? show : ccField.style.display === 'none';
    
    ccField.style.display = shouldShow ? 'flex' : 'none';
    bccField.style.display = shouldShow ? 'flex' : 'none';
    toggleBtn.style.display = shouldShow ? 'none' : 'inline';
  }

  focusFirstField() {
    const toField = this.element.querySelector('#to-field');
    const subjectField = this.element.querySelector('#subject-field');
    const messageEditor = this.element.querySelector('#message-editor');
    
    if (!toField.value) {
      toField.focus();
    } else if (!subjectField.value) {
      subjectField.focus();
    } else {
      messageEditor.focus();
    }
  }

  async sendEmail() {
    const formData = this.getFormData();
    
    if (!this.validateForm(formData)) {
      return;
    }

    try {
      // Choose endpoint based on real email mode
      const endpoint = this.realEmailMode ? '/api/emails/send-real' : '/api/emails/send';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.authService.getToken()}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const successMessage = this.realEmailMode ? 
          '✅ Real email sent successfully!' : 
          '✅ Email sent successfully!';
        this.showSuccess(successMessage);
        this.hide();
        this.reset();
        
        // Refresh email list if viewing sent folder
        window.emailApp.refreshEmailList();
      } else {
        const error = await response.json();
        this.showError(error.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      this.showError('Failed to send email');
    }
  }

  async saveDraft() {
    const formData = this.getFormData();
    formData.isDraft = true;
    
    try {
      let url = '/api/emails/draft';
      let method = 'POST';
      
      if (this.draftId) {
        url = `/api/emails/draft/${this.draftId}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.authService.getToken()}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        this.draftId = result.id;
        this.isDraft = true;
        this.showSuccess('Draft saved');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      this.showError('Failed to save draft');
    }
  }

  getFormData() {
    return {
      to: this.element.querySelector('#to-field').value,
      cc: this.element.querySelector('#cc-field').value,
      bcc: this.element.querySelector('#bcc-field').value,
      subject: this.element.querySelector('#subject-field').value,
      body: this.element.querySelector('#message-editor').innerHTML,
      parentId: this.mode !== 'compose' ? this.originalEmail?.id : null,
      type: this.mode
    };
  }

  validateForm(formData) {
    if (!formData.to.trim()) {
      this.showError('Please enter at least one recipient');
      this.element.querySelector('#to-field').focus();
      return false;
    }

    // Validate email addresses
    const emails = formData.to.split(',').map(e => e.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (const email of emails) {
      if (email && !emailRegex.test(email)) {
        this.showError(`Invalid email address: ${email}`);
        return false;
      }
    }

    return true;
  }

  hasUnsavedContent() {
    const formData = this.getFormData();
    return formData.to || formData.subject || formData.body.trim();
  }

  insertLink() {
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  }

  attachFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.addEventListener('change', (e) => {
      this.handleFileAttachment(e.target.files);
    });
    input.click();
  }

  handleFileAttachment(files) {
    const attachmentsArea = this.element.querySelector('.attachments-area');
    const attachmentsList = this.element.querySelector('.attachments-list');
    
    if (files.length > 0) {
      attachmentsArea.style.display = 'block';
    }

    Array.from(files).forEach(file => {
      const attachmentItem = document.createElement('div');
      attachmentItem.className = 'attachment-item';
      attachmentItem.innerHTML = `
        <i class="fa fa-file"></i>
        <span class="attachment-name">${file.name}</span>
        <span class="attachment-size">(${this.formatFileSize(file.size)})</span>
        <button type="button" class="remove-attachment" data-filename="${file.name}">
          <i class="fa fa-times"></i>
        </button>
      `;
      
      attachmentItem.querySelector('.remove-attachment').addEventListener('click', () => {
        attachmentItem.remove();
        if (attachmentsList.children.length === 0) {
          attachmentsArea.style.display = 'none';
        }
      });
      
      attachmentsList.appendChild(attachmentItem);
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  setupAutoSave() {
    let autoSaveTimer;
    
    const fields = [
      '#to-field', '#cc-field', '#bcc-field', 
      '#subject-field', '#message-editor'
    ];
    
    fields.forEach(selector => {
      const element = this.element.querySelector(selector);
      if (element) {
        element.addEventListener('input', () => {
          clearTimeout(autoSaveTimer);
          autoSaveTimer = setTimeout(() => {
            if (this.hasUnsavedContent()) {
              this.saveDraft();
            }
          }, 2000);
        });
      }
    });
  }

  setupRecipientValidation() {
    const toField = this.element.querySelector('#to-field');
    const ccField = this.element.querySelector('#cc-field');
    const bccField = this.element.querySelector('#bcc-field');
    
    [toField, ccField, bccField].forEach(field => {
      field.addEventListener('blur', () => {
        this.validateEmailField(field);
      });
    });
  }

  validateEmailField(field) {
    const emails = field.value.split(',').map(e => e.trim()).filter(e => e);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    field.classList.remove('invalid');
    
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        field.classList.add('invalid');
        break;
      }
    }
  }

  showError(message) {
    // Simple error display - in production, use a proper notification system
    alert(message);
  }

  showSuccess(message) {
    // Simple success display - in production, use a proper notification system
    console.log(message);
  }

  reset() {
    this.mode = 'compose';
    this.originalEmail = null;
    this.isDraft = false;
    this.draftId = null;
    
    // Clear form fields
    this.element.querySelector('#to-field').value = '';
    this.element.querySelector('#cc-field').value = '';
    this.element.querySelector('#bcc-field').value = '';
    this.element.querySelector('#subject-field').value = '';
    this.element.querySelector('#message-editor').innerHTML = '';
    
    // Hide CC/BCC fields
    this.toggleCcBcc(false);
    
    // Clear attachments
    this.element.querySelector('.attachments-area').style.display = 'none';
    this.element.querySelector('.attachments-list').innerHTML = '';
  }

  render(container) {
    container.appendChild(this.element);
    this.setupEventListeners();
    this.hide(); // Start hidden
  }
}

// Export for use in other modules
window.ComposeDialog = ComposeDialog;