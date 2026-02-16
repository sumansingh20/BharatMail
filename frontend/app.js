// Main application controller
class BhaMail {
    constructor() {
        this.currentUser = null;
        this.currentFolder = 'inbox';
        this.selectedEmails = new Set();
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        // Check for existing authentication
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const isValid = await AuthService.verifyToken(token);
                if (isValid) {
                    this.showMainApp();
                    await this.loadUserData();
                    await this.loadFolders();
                    await this.loadEmails();
                    return;
                }
            } catch (error) {
                console.log('Token verification failed:', error);
            }
        }
        
        // Initialize compose dialog
        this.composeDialog = new ComposeDialog();
        document.body.appendChild(this.composeDialog.element);
        
        this.showLoginScreen();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Search
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            KeyboardShortcuts.handleKeydown(e);
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Before unload
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.querySelector('.login-btn');
        const loader = loginBtn.querySelector('.btn-loader');

        try {
            loginBtn.disabled = true;
            loader.classList.remove('hidden');

            const result = await AuthService.login(email, password);
            
            if (result.success) {
                this.currentUser = result.user;
                localStorage.setItem('authToken', result.token);
                
                this.showMainApp();
                await this.loadUserData();
                await this.loadFolders();
                await this.loadEmails();
                
                NotificationService.show('Welcome back!', 'success');
            } else {
                NotificationService.show(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            NotificationService.show('Login failed. Please try again.', 'error');
        } finally {
            loginBtn.disabled = false;
            loader.classList.add('hidden');
        }
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mailApp').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mailApp').classList.remove('hidden');
    }

    async loadUserData() {
        if (this.currentUser) {
            document.getElementById('userAvatar').textContent = 
                this.currentUser.name.charAt(0).toUpperCase();
            
            // Update user info in header
            const userMenu = document.querySelector('.user-menu');
            userMenu.title = `${this.currentUser.name} (${this.currentUser.email})`;
        }
    }

    async loadFolders() {
        try {
            const folders = await ApiService.get('/folders');
            SidebarComponent.renderFolders(folders);
        } catch (error) {
            console.error('Failed to load folders:', error);
            NotificationService.show('Failed to load folders', 'error');
        }
    }

    async loadEmails(folder = this.currentFolder) {
        try {
            this.setLoading(true);
            this.currentFolder = folder;
            
            const emails = await EmailService.getEmailsByFolder(folder);
            EmailListComponent.render(emails);
            
            // Update folder title and count
            this.updateFolderInfo(folder, emails);
            
        } catch (error) {
            console.error('Failed to load emails:', error);
            NotificationService.show('Failed to load emails', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    updateFolderInfo(folder, emails) {
        const folderTitle = document.getElementById('folderTitle');
        const folderCount = document.getElementById('folderCount');
        
        folderTitle.textContent = this.getFolderDisplayName(folder);
        
        if (emails && emails.emails) {
            const unreadCount = emails.emails.filter(e => !e.is_read).length;
            folderCount.textContent = unreadCount > 0 ? `${unreadCount} unread` : '';
        }
    }

    getFolderDisplayName(folder) {
        const folderNames = {
            inbox: 'Inbox',
            starred: 'Starred',
            sent: 'Sent',
            drafts: 'Drafts',
            spam: 'Spam',
            trash: 'Trash',
            important: 'Important',
            snoozed: 'Snoozed',
            all: 'All Mail'
        };
        
        return folderNames[folder] || folder.charAt(0).toUpperCase() + folder.slice(1);
    }

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        
        if (!query) {
            await this.loadEmails();
            return;
        }

        try {
            this.setLoading(true);
            const results = await EmailService.searchEmails(query);
            EmailListComponent.render(results);
            
            document.getElementById('folderTitle').textContent = `Search results for "${query}"`;
            document.getElementById('folderCount').textContent = 
                `${results.emails?.length || 0} results`;
                
        } catch (error) {
            console.error('Search failed:', error);
            NotificationService.show('Search failed', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        const indicator = document.getElementById('loadingIndicator');
        
        if (loading) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    selectEmail(emailId, selected) {
        if (selected) {
            this.selectedEmails.add(emailId);
        } else {
            this.selectedEmails.delete(emailId);
        }
        
        this.updateToolbar();
    }

    selectAllEmails(selected) {
        const checkboxes = document.querySelectorAll('.email-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selected;
            const emailId = parseInt(checkbox.dataset.id);
            
            if (selected) {
                this.selectedEmails.add(emailId);
            } else {
                this.selectedEmails.delete(emailId);
            }
        });
        
        this.updateToolbar();
    }

    updateToolbar() {
        ToolbarComponent.updateState({
            selectedCount: this.selectedEmails.size,
            hasSelection: this.selectedEmails.size > 0
        });
    }

    async refreshEmails() {
        await this.loadEmails(this.currentFolder);
        NotificationService.show('Emails refreshed', 'info');
    }

    logout() {
        localStorage.removeItem('authToken');
        this.currentUser = null;
        this.selectedEmails.clear();
        this.showLoginScreen();
        NotificationService.show('Logged out successfully', 'info');
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
    }

    handleResize() {
        const isMobile = window.innerWidth <= 768;
        const sidebar = document.getElementById('sidebar');
        
        if (isMobile) {
            sidebar.classList.add('mobile');
        } else {
            sidebar.classList.remove('mobile');
        }
    }

    hasUnsavedChanges() {
        // Check if compose modal is open with unsaved content
        const composeModal = document.getElementById('composeModal');
        return composeModal && !composeModal.classList.contains('hidden');
    }

    // Utility methods
    async markAsRead(emailIds) {
        try {
            await EmailService.markAsRead(emailIds);
            await this.refreshEmails();
        } catch (error) {
            NotificationService.show('Failed to mark as read', 'error');
        }
    }

    async markAsStarred(emailIds) {
        try {
            await EmailService.markAsStarred(emailIds);
            await this.refreshEmails();
        } catch (error) {
            NotificationService.show('Failed to star emails', 'error');
        }
    }

    async deleteEmails(emailIds) {
        if (confirm(`Delete ${emailIds.length} email(s)?`)) {
            try {
                await EmailService.deleteEmails(emailIds);
                await this.refreshEmails();
                this.selectedEmails.clear();
                this.updateToolbar();
                NotificationService.show('Emails deleted', 'success');
            } catch (error) {
                NotificationService.show('Failed to delete emails', 'error');
            }
        }
    }

    // Global functions for onclick handlers
    openCompose() {
        ComposeComponent.open();
    }

    showComposeDialog(mode = 'compose', originalEmail = null, realEmailMode = false) {
        if (this.composeDialog) {
            this.composeDialog.show(mode, originalEmail, realEmailMode);
        }
    }

    openSettings() {
        SettingsComponent.open();
    }

    toggleAdvancedSearch() {
        SearchComponent.toggleAdvanced();
    }

    toggleUserMenu() {
        // Implementation for user menu dropdown
        console.log('User menu clicked');
    }

    showHelp() {
        NotificationService.show('Help & Support - Coming soon!', 'info');
    }
}

// Initialize the application
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new BhaMail();
    
    // Make app globally available for onclick handlers
    window.app = app;
    window.emailApp = app; // Add emailApp reference for compose dialog
    window.openCompose = () => app.openCompose();
    window.openSettings = () => app.openSettings();
    window.toggleAdvancedSearch = () => app.toggleAdvancedSearch();
    window.toggleUserMenu = () => app.toggleUserMenu();
    window.toggleSidebar = () => app.toggleSidebar();
    window.showHelp = () => app.showHelp();
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BhaMail;
}