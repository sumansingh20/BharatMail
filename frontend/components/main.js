// UI Component for the email list
class EmailListComponent {
    static render(emailData) {
        const container = document.getElementById('emailList');
        const { emails = [], total = 0, page = 1 } = emailData;

        if (emails.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = emails.map(email => this.renderEmailItem(email)).join('');
        
        // Add event listeners to email items
        this.attachEventListeners();
        
        // Update pagination if needed
        this.updatePagination(total, page);
    }

    static renderEmailItem(email) {
        const isRead = email.is_read;
        const isStarred = email.is_starred;
        const isImportant = email.is_important;
        const hasAttachments = email.has_attachments;
        
        const readClass = isRead ? 'read' : 'unread';
        const importantClass = isImportant ? 'important' : '';
        
        return `
            <div class="email-item ${readClass} ${importantClass}" 
                 data-id="${email.id}" 
                 onclick="EmailListComponent.openEmail(${email.id})">
                
                <div class="email-item-left">
                    <input type="checkbox" 
                           class="email-checkbox" 
                           data-id="${email.id}"
                           onclick="event.stopPropagation(); EmailListComponent.toggleSelect(this)">
                    
                    <div class="email-star ${isStarred ? 'starred' : ''}" 
                         onclick="event.stopPropagation(); EmailListComponent.toggleStar(${email.id})"
                         title="${isStarred ? 'Remove star' : 'Add star'}">
                        ★
                    </div>
                    
                    ${isImportant ? '<div class="importance-marker" title="Important">⚠</div>' : ''}
                </div>
                
                <div class="email-item-content">
                    <div class="email-item-header">
                        <div class="email-sender" title="${email.sender_email}">
                            ${this.escapeHtml(email.sender_name || email.sender_email)}
                        </div>
                        
                        <div class="email-meta">
                            ${hasAttachments ? '<span class="attachment-icon" title="Has attachments">📎</span>' : ''}
                            <span class="email-date" title="${new Date(email.created_at).toLocaleString()}">
                                ${this.formatDate(email.created_at)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="email-subject">
                        ${this.escapeHtml(email.subject || '(No subject)')}
                    </div>
                    
                    <div class="email-preview">
                        ${this.escapeHtml(email.preview || email.body_text?.substring(0, 100) || '')}
                    </div>
                    
                    ${email.labels && email.labels.length > 0 ? `
                        <div class="email-labels">
                            ${email.labels.map(label => `
                                <span class="email-label" style="background-color: ${label.color}">
                                    ${this.escapeHtml(label.name)}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    static renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-title">No emails found</div>
                <div class="empty-state-description">
                    This folder is empty or no emails match your search criteria.
                </div>
            </div>
        `;
    }

    static attachEventListeners() {
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllEmails');
        if (selectAllCheckbox) {
            selectAllCheckbox.onchange = (e) => {
                if (window.app) {
                    window.app.selectAllEmails(e.target.checked);
                }
            };
        }
    }

    static toggleSelect(checkbox) {
        const emailId = parseInt(checkbox.dataset.id);
        if (window.app) {
            window.app.selectEmail(emailId, checkbox.checked);
        }
    }

    static async toggleStar(emailId) {
        try {
            const emailItem = document.querySelector(`[data-id="${emailId}"]`);
            const starElement = emailItem.querySelector('.email-star');
            const isStarred = starElement.classList.contains('starred');
            
            if (isStarred) {
                await EmailService.markAsUnstarred([emailId]);
                starElement.classList.remove('starred');
                starElement.title = 'Add star';
            } else {
                await EmailService.markAsStarred([emailId]);
                starElement.classList.add('starred');
                starElement.title = 'Remove star';
            }
            
            NotificationService.show(
                isStarred ? 'Star removed' : 'Star added', 
                'success'
            );
        } catch (error) {
            console.error('Failed to toggle star:', error);
            NotificationService.show('Failed to update star', 'error');
        }
    }

    static async openEmail(emailId) {
        try {
            const email = await EmailService.getEmailById(emailId);
            
            // Mark as read if unread
            if (!email.is_read) {
                await EmailService.markAsRead([emailId]);
                
                // Update UI
                const emailItem = document.querySelector(`[data-id="${emailId}"]`);
                if (emailItem) {
                    emailItem.classList.remove('unread');
                    emailItem.classList.add('read');
                }
            }
            
            EmailViewComponent.open(email);
        } catch (error) {
            console.error('Failed to open email:', error);
            NotificationService.show('Failed to open email', 'error');
        }
    }

    static updatePagination(total, currentPage) {
        // Implementation for pagination controls
        const pagination = document.getElementById('pagination');
        if (pagination && total > 50) {
            const totalPages = Math.ceil(total / 50);
            pagination.innerHTML = this.renderPagination(currentPage, totalPages);
        }
    }

    static renderPagination(currentPage, totalPages) {
        let html = '<div class="pagination-controls">';
        
        // Previous button
        if (currentPage > 1) {
            html += `<button onclick="EmailListComponent.goToPage(${currentPage - 1})" class="btn-pagination">Previous</button>`;
        }
        
        // Page numbers
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            const activeClass = i === currentPage ? 'active' : '';
            html += `<button onclick="EmailListComponent.goToPage(${i})" class="btn-pagination ${activeClass}">${i}</button>`;
        }
        
        // Next button
        if (currentPage < totalPages) {
            html += `<button onclick="EmailListComponent.goToPage(${currentPage + 1})" class="btn-pagination">Next</button>`;
        }
        
        html += '</div>';
        return html;
    }

    static async goToPage(page) {
        if (window.app) {
            await window.app.loadEmails(window.app.currentFolder, page);
        }
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            // Today - show time
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else if (diffDays < 365) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
        }
    }

    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// UI Component for the sidebar
class SidebarComponent {
    static renderFolders(foldersData) {
        const container = document.getElementById('folderList');
        const { folders = [], labels = [] } = foldersData;
        
        container.innerHTML = `
            ${this.renderSystemFolders(folders)}
            ${labels.length > 0 ? this.renderLabels(labels) : ''}
            ${this.renderFooter()}
        `;
    }

    static renderSystemFolders(folders) {
        const systemFolders = [
            { id: 'inbox', name: 'Inbox', icon: '📥', count: 0 },
            { id: 'starred', name: 'Starred', icon: '⭐', count: 0 },
            { id: 'snoozed', name: 'Snoozed', icon: '💤', count: 0 },
            { id: 'important', name: 'Important', icon: '⚠️', count: 0 },
            { id: 'sent', name: 'Sent', icon: '📤', count: 0 },
            { id: 'drafts', name: 'Drafts', icon: '📝', count: 0 },
            { id: 'all', name: 'All Mail', icon: '📮', count: 0 },
            { id: 'spam', name: 'Spam', icon: '🚫', count: 0 },
            { id: 'trash', name: 'Trash', icon: '🗑️', count: 0 }
        ];

        // Merge with actual folder counts
        folders.forEach(folder => {
            const systemFolder = systemFolders.find(sf => sf.id === folder.name);
            if (systemFolder) {
                systemFolder.count = folder.unread_count || 0;
            }
        });

        return systemFolders.map(folder => `
            <div class="sidebar-item ${folder.id === window.app?.currentFolder ? 'active' : ''}" 
                 onclick="SidebarComponent.selectFolder('${folder.id}')">
                <span class="sidebar-icon">${folder.icon}</span>
                <span class="sidebar-text">${folder.name}</span>
                ${folder.count > 0 ? `<span class="sidebar-count">${folder.count}</span>` : ''}
            </div>
        `).join('');
    }

    static renderLabels(labels) {
        if (labels.length === 0) return '';
        
        return `
            <div class="sidebar-section">
                <div class="sidebar-section-title">Labels</div>
                ${labels.map(label => `
                    <div class="sidebar-item label-item" 
                         onclick="SidebarComponent.selectLabel(${label.id})">
                        <span class="label-color" style="background-color: ${label.color}"></span>
                        <span class="sidebar-text">${this.escapeHtml(label.name)}</span>
                        ${label.unread_count > 0 ? `<span class="sidebar-count">${label.unread_count}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    static renderFooter() {
        return `
            <div class="sidebar-footer">
                <div class="sidebar-item" onclick="window.app.openSettings()">
                    <span class="sidebar-icon">⚙️</span>
                    <span class="sidebar-text">Settings</span>
                </div>
                <div class="sidebar-item" onclick="window.showHelp()">
                    <span class="sidebar-icon">❓</span>
                    <span class="sidebar-text">Help</span>
                </div>
            </div>
        `;
    }

    static async selectFolder(folderId) {
        // Remove active class from all items
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected item
        event.target.closest('.sidebar-item').classList.add('active');
        
        // Load emails for selected folder
        if (window.app) {
            await window.app.loadEmails(folderId);
        }
    }

    static async selectLabel(labelId) {
        try {
            const emails = await EmailService.getEmailsByLabel(labelId);
            EmailListComponent.render(emails);
            
            // Update header
            const label = await LabelService.getLabelById(labelId);
            document.getElementById('folderTitle').textContent = label.name;
            document.getElementById('folderCount').textContent = 
                `${emails.emails?.length || 0} emails`;
        } catch (error) {
            console.error('Failed to load label emails:', error);
            NotificationService.show('Failed to load emails', 'error');
        }
    }

    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// UI Component for the toolbar
class ToolbarComponent {
    static updateState(state) {
        const { selectedCount = 0, hasSelection = false } = state;
        
        // Update selection count
        const selectionInfo = document.getElementById('selectionInfo');
        if (selectionInfo) {
            if (hasSelection) {
                selectionInfo.textContent = `${selectedCount} selected`;
                selectionInfo.classList.remove('hidden');
            } else {
                selectionInfo.classList.add('hidden');
            }
        }
        
        // Enable/disable bulk action buttons
        const bulkActions = document.querySelectorAll('.bulk-action');
        bulkActions.forEach(btn => {
            btn.disabled = !hasSelection;
        });
    }

    static async performBulkAction(action) {
        if (!window.app || window.app.selectedEmails.size === 0) {
            return;
        }

        const emailIds = Array.from(window.app.selectedEmails);
        
        try {
            switch (action) {
                case 'markRead':
                    await EmailService.markAsRead(emailIds);
                    NotificationService.show('Marked as read', 'success');
                    break;
                    
                case 'markUnread':
                    await EmailService.markAsUnread(emailIds);
                    NotificationService.show('Marked as unread', 'success');
                    break;
                    
                case 'star':
                    await EmailService.markAsStarred(emailIds);
                    NotificationService.show('Starred', 'success');
                    break;
                    
                case 'archive':
                    await EmailService.archiveEmails(emailIds);
                    NotificationService.show('Archived', 'success');
                    break;
                    
                case 'delete':
                    if (confirm(`Delete ${emailIds.length} email(s)?`)) {
                        await EmailService.deleteEmails(emailIds);
                        NotificationService.show('Deleted', 'success');
                    }
                    break;
                    
                case 'spam':
                    await EmailService.reportSpam(emailIds);
                    NotificationService.show('Marked as spam', 'success');
                    break;
            }
            
            // Refresh email list and clear selection
            await window.app.refreshEmails();
            window.app.selectedEmails.clear();
            this.updateState({ selectedCount: 0, hasSelection: false });
            
        } catch (error) {
            console.error(`Failed to perform ${action}:`, error);
            NotificationService.show(`Failed to ${action}`, 'error');
        }
    }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EmailListComponent,
        SidebarComponent,
        ToolbarComponent
    };
}