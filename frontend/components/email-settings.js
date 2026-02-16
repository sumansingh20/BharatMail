class EmailSettings {
  constructor() {
    this.isOpen = false;
    this.currentSettings = null;
    this.providers = {
      gmail: {
        name: 'Gmail',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        smtpSecure: false,
        imapSecure: true
      },
      outlook: {
        name: 'Outlook/Hotmail',
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
        imapHost: 'outlook.office365.com',
        imapPort: 993,
        smtpSecure: false,
        imapSecure: true
      },
      yahoo: {
        name: 'Yahoo Mail',
        smtpHost: 'smtp.mail.yahoo.com',
        smtpPort: 587,
        imapHost: 'imap.mail.yahoo.com',
        imapPort: 993,
        smtpSecure: false,
        imapSecure: true
      },
      custom: {
        name: 'Custom SMTP/IMAP',
        smtpHost: '',
        smtpPort: 587,
        imapHost: '',
        imapPort: 993,
        smtpSecure: false,
        imapSecure: true
      }
    };
    this.init();
  }

  init() {
    this.createModal();
    this.loadSettings();
  }

  createModal() {
    const modal = document.createElement('div');
    modal.className = 'email-settings-modal';
    modal.innerHTML = `
      <div class="email-settings-overlay">
        <div class="email-settings-content">
          <div class="email-settings-header">
            <h2>📧 Real Email Configuration</h2>
            <button class="close-btn" onclick="emailSettings.close()">
              <i class="material-icons">close</i>
            </button>
          </div>
          
          <div class="email-settings-body">
            <div class="settings-section">
              <h3>🔧 Email Provider</h3>
              <div class="provider-selection">
                <select id="emailProvider" onchange="emailSettings.onProviderChange()">
                  <option value="">Select Email Provider</option>
                  <option value="gmail">Gmail</option>
                  <option value="outlook">Outlook/Hotmail</option>
                  <option value="yahoo">Yahoo Mail</option>
                  <option value="custom">Custom SMTP/IMAP</option>
                </select>
              </div>
            </div>

            <div class="settings-section">
              <h3>👤 Account Information</h3>
              <div class="form-group">
                <label for="emailAddress">Email Address *</label>
                <input type="email" id="emailAddress" placeholder="your.email@example.com" required>
              </div>
              <div class="form-group">
                <label for="emailPassword">Password / App Password *</label>
                <input type="password" id="emailPassword" placeholder="Your email password or app password" required>
                <small class="help-text">
                  💡 For Gmail/Outlook, use App Password instead of regular password
                </small>
              </div>
              <div class="form-group">
                <label for="displayName">Display Name</label>
                <input type="text" id="displayName" placeholder="Your Name">
              </div>
            </div>

            <div class="settings-section" id="smtpSettings">
              <h3>📤 SMTP Settings (Outgoing Mail)</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="smtpHost">SMTP Server *</label>
                  <input type="text" id="smtpHost" placeholder="smtp.example.com" required>
                </div>
                <div class="form-group">
                  <label for="smtpPort">Port *</label>
                  <input type="number" id="smtpPort" placeholder="587" required>
                </div>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="smtpSecure">
                  Use SSL/TLS Encryption
                </label>
              </div>
            </div>

            <div class="settings-section" id="imapSettings">
              <h3>📥 IMAP Settings (Incoming Mail)</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="imapHost">IMAP Server *</label>
                  <input type="text" id="imapHost" placeholder="imap.example.com" required>
                </div>
                <div class="form-group">
                  <label for="imapPort">Port *</label>
                  <input type="number" id="imapPort" placeholder="993" required>
                </div>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="imapSecure" checked>
                  Use SSL/TLS Encryption
                </label>
              </div>
            </div>

            <div class="settings-section">
              <h3>⚙️ Sync Settings</h3>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="autoSync" checked>
                  Enable Automatic Email Sync
                </label>
              </div>
              <div class="form-group">
                <label for="syncFrequency">Sync Frequency (seconds)</label>
                <select id="syncFrequency">
                  <option value="60">Every minute</option>
                  <option value="300" selected>Every 5 minutes</option>
                  <option value="600">Every 10 minutes</option>
                  <option value="1800">Every 30 minutes</option>
                  <option value="3600">Every hour</option>
                </select>
              </div>
            </div>

            <div class="settings-section">
              <h3>✍️ Email Signature</h3>
              <div class="form-group">
                <textarea id="signature" placeholder="Best regards,&#10;Your Name&#10;Your Company" rows="4"></textarea>
              </div>
            </div>
          </div>

          <div class="email-settings-footer">
            <div class="button-group">
              <button class="btn btn-secondary" onclick="emailSettings.testConnection()">
                <i class="material-icons">wifi_tethering</i>
                Test Connection
              </button>
              <button class="btn btn-danger" onclick="emailSettings.deleteSettings()" id="deleteBtn" style="display: none;">
                <i class="material-icons">delete</i>
                Delete Settings
              </button>
              <button class="btn btn-primary" onclick="emailSettings.save()">
                <i class="material-icons">save</i>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;
  }

  async loadSettings() {
    try {
      const response = await fetch('/api/settings/email', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        this.currentSettings = await response.json();
        this.populateForm();
        document.getElementById('deleteBtn').style.display = 'block';
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    }
  }

  populateForm() {
    if (!this.currentSettings) return;

    const settings = this.currentSettings;
    
    document.getElementById('emailProvider').value = settings.provider || '';
    document.getElementById('emailAddress').value = settings.email || '';
    document.getElementById('displayName').value = settings.display_name || '';
    document.getElementById('smtpHost').value = settings.smtp_host || '';
    document.getElementById('smtpPort').value = settings.smtp_port || '';
    document.getElementById('smtpSecure').checked = Boolean(settings.smtp_secure);
    document.getElementById('imapHost').value = settings.imap_host || '';
    document.getElementById('imapPort').value = settings.imap_port || '';
    document.getElementById('imapSecure').checked = Boolean(settings.imap_secure);
    document.getElementById('autoSync').checked = Boolean(settings.auto_sync);
    document.getElementById('syncFrequency').value = settings.sync_frequency || '300';
    document.getElementById('signature').value = settings.signature || '';
  }

  onProviderChange() {
    const provider = document.getElementById('emailProvider').value;
    if (provider && this.providers[provider]) {
      const config = this.providers[provider];
      
      document.getElementById('smtpHost').value = config.smtpHost;
      document.getElementById('smtpPort').value = config.smtpPort;
      document.getElementById('smtpSecure').checked = config.smtpSecure;
      document.getElementById('imapHost').value = config.imapHost;
      document.getElementById('imapPort').value = config.imapPort;
      document.getElementById('imapSecure').checked = config.imapSecure;
    }
  }

  async testConnection() {
    const formData = this.getFormData();
    if (!this.validateForm(formData)) return;

    const testBtn = document.querySelector('.btn-secondary');
    const originalText = testBtn.innerHTML;
    testBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Testing...';
    testBtn.disabled = true;

    try {
      const response = await fetch('/api/settings/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        this.showMessage('✅ Connection test successful! Both SMTP and IMAP are working.', 'success');
      } else {
        this.showMessage(`❌ Connection test failed: ${result.error}`, 'error');
      }
    } catch (error) {
      this.showMessage(`❌ Connection test failed: ${error.message}`, 'error');
    } finally {
      testBtn.innerHTML = originalText;
      testBtn.disabled = false;
    }
  }

  async save() {
    const formData = this.getFormData();
    if (!this.validateForm(formData)) return;

    const saveBtn = document.querySelector('.btn-primary');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Saving...';
    saveBtn.disabled = true;

    try {
      const response = await fetch('/api/settings/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        this.showMessage('✅ Email settings saved successfully!', 'success');
        this.currentSettings = result;
        document.getElementById('deleteBtn').style.display = 'block';
      } else {
        this.showMessage(`❌ Save failed: ${result.error}`, 'error');
      }
    } catch (error) {
      this.showMessage(`❌ Save failed: ${error.message}`, 'error');
    } finally {
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    }
  }

  async deleteSettings() {
    if (!confirm('Are you sure you want to delete your email settings? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/settings/email', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        this.showMessage('✅ Email settings deleted successfully!', 'success');
        this.currentSettings = null;
        this.clearForm();
        document.getElementById('deleteBtn').style.display = 'none';
      } else {
        const result = await response.json();
        this.showMessage(`❌ Delete failed: ${result.error}`, 'error');
      }
    } catch (error) {
      this.showMessage(`❌ Delete failed: ${error.message}`, 'error');
    }
  }

  getFormData() {
    return {
      provider: document.getElementById('emailProvider').value,
      email: document.getElementById('emailAddress').value,
      password: document.getElementById('emailPassword').value,
      display_name: document.getElementById('displayName').value,
      smtp_host: document.getElementById('smtpHost').value,
      smtp_port: parseInt(document.getElementById('smtpPort').value),
      smtp_secure: document.getElementById('smtpSecure').checked,
      imap_host: document.getElementById('imapHost').value,
      imap_port: parseInt(document.getElementById('imapPort').value),
      imap_secure: document.getElementById('imapSecure').checked,
      auto_sync: document.getElementById('autoSync').checked,
      sync_frequency: parseInt(document.getElementById('syncFrequency').value),
      signature: document.getElementById('signature').value
    };
  }

  validateForm(data) {
    if (!data.email || !data.password || !data.smtp_host || !data.smtp_port || !data.imap_host || !data.imap_port) {
      this.showMessage('❌ Please fill in all required fields marked with *', 'error');
      return false;
    }

    if (!this.isValidEmail(data.email)) {
      this.showMessage('❌ Please enter a valid email address', 'error');
      return false;
    }

    return true;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  clearForm() {
    const form = this.modal.querySelector('.email-settings-body');
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        input.checked = input.id === 'imapSecure' || input.id === 'autoSync';
      } else {
        input.value = '';
      }
    });
  }

  showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.settings-message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `settings-message ${type}`;
    messageDiv.innerHTML = message;

    const footer = this.modal.querySelector('.email-settings-footer');
    footer.insertBefore(messageDiv, footer.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  open() {
    this.isOpen = true;
    this.modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    this.loadSettings();
  }

  close() {
    this.isOpen = false;
    this.modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Global instance
const emailSettings = new EmailSettings();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailSettings;
}