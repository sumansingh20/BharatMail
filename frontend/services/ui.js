// Notification service for user feedback
class NotificationService {
    static notifications = [];
    static container = null;

    static init() {
        this.createContainer();
    }

    static createContainer() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.id = 'notificationContainer';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    static show(message, type = 'info', duration = 3000) {
        this.init();
        
        const notification = {
            id: Utils.generateId(),
            message,
            type,
            duration,
            timestamp: Date.now()
        };
        
        this.notifications.push(notification);
        this.render(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, duration);
        }
        
        return notification.id;
    }

    static render(notification) {
        const element = document.createElement('div');
        element.id = `notification-${notification.id}`;
        element.className = `notification notification-${notification.type}`;
        
        element.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getIcon(notification.type)}</span>
                <span class="notification-message">${Utils.escapeHtml(notification.message)}</span>
                <button class="notification-close" onclick="NotificationService.remove('${notification.id}')">
                    ✕
                </button>
            </div>
        `;
        
        this.container.appendChild(element);
        
        // Trigger animation
        requestAnimationFrame(() => {
            element.classList.add('show');
        });
    }

    static remove(id) {
        const element = document.getElementById(`notification-${id}`);
        if (element) {
            element.classList.remove('show');
            element.classList.add('hide');
            
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }
        
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    static getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        return icons[type] || icons.info;
    }

    static clear() {
        this.notifications.forEach(notification => {
            this.remove(notification.id);
        });
    }

    static success(message, duration) {
        return this.show(message, 'success', duration);
    }

    static error(message, duration) {
        return this.show(message, 'error', duration);
    }

    static warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    static info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Keyboard shortcuts handler
class KeyboardShortcuts {
    static shortcuts = new Map();
    static isEnabled = true;

    static init() {
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        this.registerDefaultShortcuts();
    }

    static registerDefaultShortcuts() {
        // Compose
        this.register('c', () => window.app?.openCompose());
        
        // Navigation
        this.register('g+i', () => window.app?.loadEmails('inbox'));
        this.register('g+s', () => window.app?.loadEmails('starred'));
        this.register('g+d', () => window.app?.loadEmails('drafts'));
        this.register('g+a', () => window.app?.loadEmails('all'));
        
        // Actions
        this.register('r', () => this.replyToCurrentEmail());
        this.register('a', () => this.replyAllToCurrentEmail());
        this.register('f', () => this.forwardCurrentEmail());
        this.register('s', () => this.starCurrentEmail());
        
        // Selection
        this.register('x', () => this.toggleCurrentEmailSelection());
        this.register('*+a', () => this.selectAllEmails());
        this.register('*+n', () => this.deselectAllEmails());
        
        // Search
        this.register('/', () => this.focusSearch());
        this.register('Escape', () => this.closeModals());
        
        // Archive/Delete
        this.register('e', () => this.archiveSelected());
        this.register('#', () => this.deleteSelected());
        
        // Labels
        this.register('l', () => this.showLabelMenu());
        
        // Refresh
        this.register('r', () => this.refresh(), { ctrl: true });
    }

    static register(keyCombo, callback, options = {}) {
        this.shortcuts.set(keyCombo.toLowerCase(), { callback, options });
    }

    static unregister(keyCombo) {
        this.shortcuts.delete(keyCombo.toLowerCase());
    }

    static handleKeydown(event) {
        if (!this.isEnabled) return;
        
        // Don't handle shortcuts when typing in inputs
        const activeElement = document.activeElement;
        if (activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        )) {
            // Allow Ctrl+shortcuts in text fields
            if (!event.ctrlKey && !event.metaKey) return;
        }
        
        const keyCombo = this.buildKeyCombo(event);
        const shortcut = this.shortcuts.get(keyCombo);
        
        if (shortcut) {
            const { callback, options } = shortcut;
            
            // Check modifier requirements
            if (options.ctrl && !event.ctrlKey) return;
            if (options.alt && !event.altKey) return;
            if (options.shift && !event.shiftKey) return;
            
            event.preventDefault();
            callback(event);
        }
    }

    static buildKeyCombo(event) {
        const parts = [];
        
        if (event.ctrlKey) parts.push('ctrl');
        if (event.altKey) parts.push('alt');
        if (event.shiftKey) parts.push('shift');
        
        // Handle special keys
        const specialKeys = {
            ' ': 'space',
            'Enter': 'enter',
            'Escape': 'escape',
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'Backspace': 'backspace',
            'Delete': 'delete',
            'Tab': 'tab'
        };
        
        const key = specialKeys[event.key] || event.key.toLowerCase();
        parts.push(key);
        
        return parts.join('+');
    }

    static enable() {
        this.isEnabled = true;
    }

    static disable() {
        this.isEnabled = false;
    }

    // Shortcut action implementations
    static replyToCurrentEmail() {
        // Implementation depends on current email view state
        console.log('Reply shortcut triggered');
    }

    static replyAllToCurrentEmail() {
        console.log('Reply all shortcut triggered');
    }

    static forwardCurrentEmail() {
        console.log('Forward shortcut triggered');
    }

    static starCurrentEmail() {
        console.log('Star shortcut triggered');
    }

    static toggleCurrentEmailSelection() {
        console.log('Toggle selection shortcut triggered');
    }

    static selectAllEmails() {
        if (window.app) {
            window.app.selectAllEmails(true);
        }
    }

    static deselectAllEmails() {
        if (window.app) {
            window.app.selectAllEmails(false);
        }
    }

    static focusSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    static closeModals() {
        // Close any open modals
        const modals = document.querySelectorAll('.modal:not(.hidden)');
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.modal-actions button[onclick*="close"]');
            if (closeBtn) closeBtn.click();
        });
    }

    static archiveSelected() {
        if (window.app && window.app.selectedEmails.size > 0) {
            ToolbarComponent.performBulkAction('archive');
        }
    }

    static deleteSelected() {
        if (window.app && window.app.selectedEmails.size > 0) {
            ToolbarComponent.performBulkAction('delete');
        }
    }

    static showLabelMenu() {
        console.log('Label menu shortcut triggered');
    }

    static refresh() {
        if (window.app) {
            window.app.refreshEmails();
        }
    }
}

// Search component for advanced search functionality
class SearchComponent {
    static isAdvancedOpen = false;

    static toggleAdvanced() {
        this.isAdvancedOpen = !this.isAdvancedOpen;
        
        const container = document.getElementById('advancedSearch');
        if (!container) {
            this.createAdvancedSearch();
            return;
        }
        
        if (this.isAdvancedOpen) {
            container.classList.remove('hidden');
            this.focusFirstField();
        } else {
            container.classList.add('hidden');
        }
    }

    static createAdvancedSearch() {
        const container = document.createElement('div');
        container.id = 'advancedSearch';
        container.className = 'advanced-search';
        
        container.innerHTML = `
            <div class="advanced-search-content">
                <div class="advanced-search-header">
                    <h3>Advanced Search</h3>
                    <button class="btn-icon" onclick="SearchComponent.toggleAdvanced()">✕</button>
                </div>
                
                <form id="advancedSearchForm" onsubmit="SearchComponent.performAdvancedSearch(event)">
                    <div class="search-fields">
                        <div class="search-field">
                            <label for="searchFrom">From:</label>
                            <input type="email" id="searchFrom" name="from" placeholder="sender@example.com">
                        </div>
                        
                        <div class="search-field">
                            <label for="searchTo">To:</label>
                            <input type="email" id="searchTo" name="to" placeholder="recipient@example.com">
                        </div>
                        
                        <div class="search-field">
                            <label for="searchSubject">Subject:</label>
                            <input type="text" id="searchSubject" name="subject" placeholder="Subject contains...">
                        </div>
                        
                        <div class="search-field">
                            <label for="searchBody">Body:</label>
                            <input type="text" id="searchBody" name="body" placeholder="Message contains...">
                        </div>
                        
                        <div class="search-field">
                            <label for="searchDateFrom">Date from:</label>
                            <input type="date" id="searchDateFrom" name="dateFrom">
                        </div>
                        
                        <div class="search-field">
                            <label for="searchDateTo">Date to:</label>
                            <input type="date" id="searchDateTo" name="dateTo">
                        </div>
                        
                        <div class="search-field">
                            <label for="searchHasAttachment">Has attachment:</label>
                            <select id="searchHasAttachment" name="hasAttachment">
                                <option value="">Any</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                        
                        <div class="search-field">
                            <label for="searchIsRead">Read status:</label>
                            <select id="searchIsRead" name="isRead">
                                <option value="">Any</option>
                                <option value="true">Read</option>
                                <option value="false">Unread</option>
                            </select>
                        </div>
                        
                        <div class="search-field">
                            <label for="searchIsStarred">Starred:</label>
                            <select id="searchIsStarred" name="isStarred">
                                <option value="">Any</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="search-actions">
                        <button type="submit" class="btn-primary">Search</button>
                        <button type="button" class="btn-secondary" onclick="SearchComponent.clearAdvanced()">Clear</button>
                        <button type="button" class="btn-secondary" onclick="SearchComponent.toggleAdvanced()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        // Insert after search bar
        const searchBar = document.querySelector('.search-container');
        searchBar.parentNode.insertBefore(container, searchBar.nextSibling);
        
        this.isAdvancedOpen = true;
        this.focusFirstField();
    }

    static focusFirstField() {
        const firstField = document.getElementById('searchFrom');
        if (firstField) {
            firstField.focus();
        }
    }

    static async performAdvancedSearch(event) {
        event.preventDefault();
        
        const form = document.getElementById('advancedSearchForm');
        const formData = new FormData(form);
        const filters = {};
        
        // Build filters object
        for (const [key, value] of formData) {
            if (value.trim()) {
                filters[key] = value.trim();
            }
        }
        
        try {
            const results = await EmailService.searchEmails('', filters);
            EmailListComponent.render(results);
            
            // Update header
            document.getElementById('folderTitle').textContent = 'Search Results';
            document.getElementById('folderCount').textContent = 
                `${results.emails?.length || 0} results`;
            
            this.toggleAdvanced(); // Close advanced search
            
        } catch (error) {
            console.error('Advanced search failed:', error);
            NotificationService.show('Search failed', 'error');
        }
    }

    static clearAdvanced() {
        const form = document.getElementById('advancedSearchForm');
        if (form) {
            form.reset();
        }
    }
}

// Settings component for user preferences
class SettingsComponent {
    static currentSettings = null;

    static async open() {
        try {
            this.currentSettings = await SettingsService.getSettings();
            this.renderModal();
            this.showModal();
        } catch (error) {
            console.error('Failed to load settings:', error);
            NotificationService.show('Failed to load settings', 'error');
        }
    }

    static close() {
        const modal = document.getElementById('settingsModal');
        modal.classList.add('hidden');
    }

    static renderModal() {
        const modal = document.getElementById('settingsModal');
        if (!modal) {
            this.createModal();
            return this.renderModal();
        }

        modal.innerHTML = `
            <div class="modal-content settings-content">
                <div class="modal-header">
                    <h2 class="modal-title">Settings</h2>
                    <button class="btn-icon" onclick="SettingsComponent.close()">✕</button>
                </div>
                
                <div class="modal-body">
                    <div class="settings-tabs">
                        <button class="settings-tab active" onclick="SettingsComponent.showTab('general')">
                            General
                        </button>
                        <button class="settings-tab" onclick="SettingsComponent.showTab('appearance')">
                            Appearance
                        </button>
                        <button class="settings-tab" onclick="SettingsComponent.showTab('notifications')">
                            Notifications
                        </button>
                        <button class="settings-tab" onclick="SettingsComponent.showTab('filters')">
                            Filters
                        </button>
                        <button class="settings-tab" onclick="SettingsComponent.showTab('labels')">
                            Labels
                        </button>
                    </div>
                    
                    <div class="settings-content">
                        ${this.renderTabContent('general')}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-primary" onclick="SettingsComponent.save()">
                        Save Changes
                    </button>
                    <button class="btn-secondary" onclick="SettingsComponent.close()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }

    static createModal() {
        const modal = document.createElement('div');
        modal.id = 'settingsModal';
        modal.className = 'modal hidden';
        modal.onclick = (e) => {
            if (e.target === modal) this.close();
        };
        
        document.body.appendChild(modal);
    }

    static showModal() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('hidden');
    }

    static showTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Update content
        const content = document.querySelector('.settings-content');
        content.innerHTML = this.renderTabContent(tabName);
    }

    static renderTabContent(tabName) {
        switch (tabName) {
            case 'general':
                return this.renderGeneralSettings();
            case 'appearance':
                return this.renderAppearanceSettings();
            case 'notifications':
                return this.renderNotificationSettings();
            case 'filters':
                return this.renderFiltersSettings();
            case 'labels':
                return this.renderLabelsSettings();
            default:
                return '<div>Settings content</div>';
        }
    }

    static renderGeneralSettings() {
        const settings = this.currentSettings || {};
        
        return `
            <div class="settings-section">
                <h3>General Preferences</h3>
                
                <div class="setting-item">
                    <label for="emailsPerPage">Emails per page:</label>
                    <select id="emailsPerPage" name="emailsPerPage">
                        <option value="25" ${settings.emailsPerPage === 25 ? 'selected' : ''}>25</option>
                        <option value="50" ${settings.emailsPerPage === 50 ? 'selected' : ''}>50</option>
                        <option value="100" ${settings.emailsPerPage === 100 ? 'selected' : ''}>100</option>
                    </select>
                </div>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" 
                               name="autoSaveDrafts" 
                               ${settings.autoSaveDrafts ? 'checked' : ''}>
                        Auto-save drafts
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" 
                               name="enableKeyboardShortcuts" 
                               ${settings.enableKeyboardShortcuts !== false ? 'checked' : ''}>
                        Enable keyboard shortcuts
                    </label>
                </div>
                
                <div class="setting-item">
                    <label for="defaultSnoozeTime">Default snooze time:</label>
                    <select id="defaultSnoozeTime" name="defaultSnoozeTime">
                        <option value="1h" ${settings.defaultSnoozeTime === '1h' ? 'selected' : ''}>1 hour</option>
                        <option value="4h" ${settings.defaultSnoozeTime === '4h' ? 'selected' : ''}>4 hours</option>
                        <option value="1d" ${settings.defaultSnoozeTime === '1d' ? 'selected' : ''}>Tomorrow</option>
                        <option value="1w" ${settings.defaultSnoozeTime === '1w' ? 'selected' : ''}>Next week</option>
                    </select>
                </div>
            </div>
        `;
    }

    static renderAppearanceSettings() {
        const settings = this.currentSettings || {};
        
        return `
            <div class="settings-section">
                <h3>Appearance</h3>
                
                <div class="setting-item">
                    <label for="theme">Theme:</label>
                    <select id="theme" name="theme">
                        <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                        <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                        <option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>Auto</option>
                    </select>
                </div>
                
                <div class="setting-item">
                    <label for="density">Display density:</label>
                    <select id="density" name="density">
                        <option value="comfortable" ${settings.density === 'comfortable' ? 'selected' : ''}>Comfortable</option>
                        <option value="compact" ${settings.density === 'compact' ? 'selected' : ''}>Compact</option>
                        <option value="cozy" ${settings.density === 'cozy' ? 'selected' : ''}>Cozy</option>
                    </select>
                </div>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" 
                               name="showEmailPreview" 
                               ${settings.showEmailPreview !== false ? 'checked' : ''}>
                        Show email preview
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" 
                               name="showAvatars" 
                               ${settings.showAvatars !== false ? 'checked' : ''}>
                        Show sender avatars
                    </label>
                </div>
            </div>
        `;
    }

    static renderNotificationSettings() {
        const settings = this.currentSettings || {};
        
        return `
            <div class="settings-section">
                <h3>Notifications</h3>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" 
                               name="desktopNotifications" 
                               ${settings.desktopNotifications ? 'checked' : ''}>
                        Desktop notifications
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" 
                               name="soundNotifications" 
                               ${settings.soundNotifications ? 'checked' : ''}>
                        Sound notifications
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" 
                               name="emailNotifications" 
                               ${settings.emailNotifications ? 'checked' : ''}>
                        Email notifications
                    </label>
                </div>
                
                <div class="setting-item">
                    <label for="notificationFrequency">Notification frequency:</label>
                    <select id="notificationFrequency" name="notificationFrequency">
                        <option value="instant" ${settings.notificationFrequency === 'instant' ? 'selected' : ''}>Instant</option>
                        <option value="hourly" ${settings.notificationFrequency === 'hourly' ? 'selected' : ''}>Hourly</option>
                        <option value="daily" ${settings.notificationFrequency === 'daily' ? 'selected' : ''}>Daily</option>
                        <option value="never" ${settings.notificationFrequency === 'never' ? 'selected' : ''}>Never</option>
                    </select>
                </div>
            </div>
        `;
    }

    static renderFiltersSettings() {
        return `
            <div class="settings-section">
                <h3>Email Filters</h3>
                <p>Filters help automatically organize your emails.</p>
                
                <div class="filters-list" id="filtersList">
                    <!-- Filters will be loaded here -->
                </div>
                
                <button class="btn-primary" onclick="SettingsComponent.createFilter()">
                    Create New Filter
                </button>
            </div>
        `;
    }

    static renderLabelsSettings() {
        return `
            <div class="settings-section">
                <h3>Labels</h3>
                <p>Create and manage custom labels for organizing your emails.</p>
                
                <div class="labels-list" id="labelsList">
                    <!-- Labels will be loaded here -->
                </div>
                
                <button class="btn-primary" onclick="SettingsComponent.createLabel()">
                    Create New Label
                </button>
            </div>
        `;
    }

    static async save() {
        try {
            const form = document.querySelector('.settings-content');
            const formData = new FormData(form);
            const settings = {};
            
            // Collect all form data
            for (const [key, value] of formData) {
                if (value === 'on') {
                    settings[key] = true;
                } else if (value === 'off') {
                    settings[key] = false;
                } else {
                    settings[key] = value;
                }
            }
            
            // Handle checkboxes that aren't checked
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (!checkbox.checked) {
                    settings[checkbox.name] = false;
                }
            });
            
            await SettingsService.updateSettings(settings);
            
            this.close();
            NotificationService.show('Settings saved', 'success');
            
            // Apply settings immediately if needed
            this.applySettings(settings);
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            NotificationService.show('Failed to save settings', 'error');
        }
    }

    static applySettings(settings) {
        // Apply theme
        if (settings.theme) {
            document.body.className = document.body.className.replace(/theme-\w+/, '');
            document.body.classList.add(`theme-${settings.theme}`);
        }
        
        // Apply density
        if (settings.density) {
            document.body.className = document.body.className.replace(/density-\w+/, '');
            document.body.classList.add(`density-${settings.density}`);
        }
        
        // Apply keyboard shortcuts
        if (settings.enableKeyboardShortcuts === false) {
            KeyboardShortcuts.disable();
        } else {
            KeyboardShortcuts.enable();
        }
    }

    static createFilter() {
        // Implementation for creating email filters
        console.log('Create filter clicked');
    }

    static createLabel() {
        // Implementation for creating labels
        console.log('Create label clicked');
    }
}

// Initialize services
document.addEventListener('DOMContentLoaded', () => {
    NotificationService.init();
    KeyboardShortcuts.init();
});

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NotificationService,
        KeyboardShortcuts,
        SearchComponent,
        SettingsComponent
    };
}