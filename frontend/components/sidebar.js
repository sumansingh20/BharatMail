// Sidebar component for BhaMail navigation
class Sidebar {
  constructor() {
    this.element = this.createElement();
    this.setupEventListeners();
  }

  createElement() {
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <h1>BhaMail</h1>
      </div>
      
      <div class="compose-btn-container">
        <button id="compose-btn" class="compose-btn">
          <i class="fa fa-edit"></i>
          Compose
        </button>
      </div>

      <div class="sidebar-menu">
        <div class="menu-item active" data-folder="inbox">
          <i class="fa fa-inbox"></i>
          <span>Inbox</span>
          <span class="count" id="inbox-count">0</span>
        </div>
        
        <div class="menu-item" data-folder="starred">
          <i class="fa fa-star"></i>
          <span>Starred</span>
        </div>
        
        <div class="menu-item" data-folder="sent">
          <i class="fa fa-paper-plane"></i>
          <span>Sent</span>
        </div>
        
        <div class="menu-item" data-folder="drafts">
          <i class="fa fa-file-text"></i>
          <span>Drafts</span>
          <span class="count" id="drafts-count">0</span>
        </div>
        
        <div class="menu-item" data-folder="spam">
          <i class="fa fa-exclamation-triangle"></i>
          <span>Spam</span>
        </div>
        
        <div class="menu-item" data-folder="trash">
          <i class="fa fa-trash"></i>
          <span>Trash</span>
        </div>
      </div>

      <div class="sidebar-divider"></div>

      <div class="sidebar-settings">
        <div class="menu-item settings-item" id="email-settings-btn">
          <i class="fa fa-cog"></i>
          <span>Email Settings</span>
        </div>
        <div class="menu-item settings-item" id="send-real-email-btn">
          <i class="fa fa-send"></i>
          <span>Send Real Email</span>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="storage-info">
          <div class="storage-bar">
            <div class="storage-used" style="width: 15%"></div>
          </div>
          <small>1.5 GB of 15 GB used</small>
        </div>
      </div>
    `;
    return sidebar;
  }

  setupEventListeners() {
    // Menu item click handler
    this.element.addEventListener('click', (e) => {
      const menuItem = e.target.closest('.menu-item');
      if (menuItem) {
        this.selectMenuItem(menuItem);
        const folder = menuItem.dataset.folder;
        window.emailApp.loadFolder(folder);
      }

      // Compose button handler
      if (e.target.closest('#compose-btn')) {
        window.emailApp.showComposeDialog();
      }

      // Email settings handler
      if (e.target.closest('#email-settings-btn')) {
        emailSettings.open();
      }

      // Send real email handler
      if (e.target.closest('#send-real-email-btn')) {
        this.showRealEmailComposer();
      }
    });
  }

  selectMenuItem(selectedItem) {
    // Remove active class from all items
    this.element.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to selected item
    selectedItem.classList.add('active');
  }

  updateCounts(counts) {
    const inboxCountEl = this.element.querySelector('#inbox-count');
    const draftsCountEl = this.element.querySelector('#drafts-count');
    
    if (inboxCountEl && counts.inbox !== undefined) {
      inboxCountEl.textContent = counts.inbox;
      inboxCountEl.style.display = counts.inbox > 0 ? 'inline' : 'none';
    }
    
    if (draftsCountEl && counts.drafts !== undefined) {
      draftsCountEl.textContent = counts.drafts;
      draftsCountEl.style.display = counts.drafts > 0 ? 'inline' : 'none';
    }
  }

  showRealEmailComposer() {
    // Check if email settings are configured
    fetch('/api/settings/email', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else if (response.status === 404) {
        throw new Error('no_settings');
      } else {
        throw new Error('Failed to check email settings');
      }
    })
    .then(settings => {
      // Settings exist, show composer with real email option
      window.emailApp.showComposeDialog('compose', null, true); // true = real email mode
    })
    .catch(error => {
      if (error.message === 'no_settings') {
        // No settings configured, prompt user to set up
        if (confirm('📧 To send real emails, you need to configure your email settings first.\n\nWould you like to set up your email account now?')) {
          emailSettings.open();
        }
      } else {
        console.error('Error checking email settings:', error);
        alert('❌ Error checking email settings. Please try again.');
      }
    });
  }

  render(container) {
    container.appendChild(this.element);
  }
}

// Export for use in other modules
window.Sidebar = Sidebar;