// UI Component for email viewing and reading
class EmailViewComponent {
    static open(email) {
        this.currentEmail = email;
        this.renderModal(email);
        this.showModal();
    }

    static close() {
        const modal = document.getElementById('emailViewModal');
        modal.classList.add('hidden');
        this.currentEmail = null;
    }

    static renderModal(email) {
        const modal = document.getElementById('emailViewModal');
        if (!modal) {
            this.createModal();
            return this.renderModal(email);
        }

        modal.innerHTML = `
            <div class="modal-content email-view-content">
                <div class="modal-header">
                    <h2 class="modal-title">${this.escapeHtml(email.subject || '(No subject)')}</h2>
                    <div class="modal-actions">
                        ${this.renderEmailActions(email)}
                        <button class="btn-icon" onclick="EmailViewComponent.close()" title="Close">
                            ✕
                        </button>
                    </div>
                </div>
                
                <div class="modal-body">
                    ${this.renderEmailContent(email)}
                </div>
            </div>
        `;
    }

    static createModal() {
        const modal = document.createElement('div');
        modal.id = 'emailViewModal';
        modal.className = 'modal hidden';
        modal.onclick = (e) => {
            if (e.target === modal) this.close();
        };
        
        document.body.appendChild(modal);
    }

    static renderEmailActions(email) {
        return `
            <div class="email-actions">
                <button class="btn-icon" onclick="EmailViewComponent.reply()" title="Reply">
                    ↩️
                </button>
                <button class="btn-icon" onclick="EmailViewComponent.replyAll()" title="Reply All">
                    ↩️👥
                </button>
                <button class="btn-icon" onclick="EmailViewComponent.forward()" title="Forward">
                    ➡️
                </button>
                <button class="btn-icon ${email.is_starred ? 'starred' : ''}" 
                        onclick="EmailViewComponent.toggleStar()" title="Star">
                    ⭐
                </button>
                <button class="btn-icon" onclick="EmailViewComponent.delete()" title="Delete">
                    🗑️
                </button>
                <button class="btn-icon" onclick="EmailViewComponent.markAsSpam()" title="Mark as Spam">
                    🚫
                </button>
            </div>
        `;
    }

    static renderEmailContent(email) {
        return `
            <div class="email-header">
                <div class="email-participants">
                    <div class="email-from">
                        <strong>From:</strong> 
                        <span class="participant">
                            ${this.escapeHtml(email.sender_name || email.sender_email)}
                            &lt;${this.escapeHtml(email.sender_email)}&gt;
                        </span>
                    </div>
                    
                    ${email.recipients ? `
                        <div class="email-to">
                            <strong>To:</strong> 
                            ${email.recipients.map(recipient => `
                                <span class="participant">
                                    ${this.escapeHtml(recipient.name || recipient.email)}
                                    &lt;${this.escapeHtml(recipient.email)}&gt;
                                </span>
                            `).join(', ')}
                        </div>
                    ` : ''}
                    
                    ${email.cc_recipients && email.cc_recipients.length > 0 ? `
                        <div class="email-cc">
                            <strong>CC:</strong> 
                            ${email.cc_recipients.map(recipient => `
                                <span class="participant">
                                    ${this.escapeHtml(recipient.name || recipient.email)}
                                    &lt;${this.escapeHtml(recipient.email)}&gt;
                                </span>
                            `).join(', ')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="email-metadata">
                    <div class="email-date">
                        ${new Date(email.created_at).toLocaleString()}
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
            
            ${email.attachments && email.attachments.length > 0 ? `
                <div class="email-attachments">
                    <div class="attachments-header">
                        <strong>Attachments (${email.attachments.length})</strong>
                    </div>
                    <div class="attachments-list">
                        ${email.attachments.map(attachment => `
                            <div class="attachment-item" onclick="EmailViewComponent.downloadAttachment(${attachment.id})">
                                <span class="attachment-icon">${this.getFileIcon(attachment.filename)}</span>
                                <span class="attachment-name">${this.escapeHtml(attachment.filename)}</span>
                                <span class="attachment-size">${this.formatFileSize(attachment.size)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="email-body">
                ${email.body_html || this.formatPlainText(email.body_text)}
            </div>
        `;
    }

    static showModal() {
        const modal = document.getElementById('emailViewModal');
        modal.classList.remove('hidden');
        
        // Focus management for accessibility
        modal.focus();
        
        // Add keyboard event listener
        this.addKeyboardListeners();
    }

    static addKeyboardListeners() {
        const handler = (e) => {
            if (e.key === 'Escape') {
                this.close();
                document.removeEventListener('keydown', handler);
            } else if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
                this.reply();
            } else if (e.key === 'a' && !e.ctrlKey && !e.metaKey) {
                this.replyAll();
            } else if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
                this.forward();
            } else if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
                this.toggleStar();
            } else if (e.key === 'Delete' || e.key === '#') {
                this.delete();
            }
        };
        
        document.addEventListener('keydown', handler);
    }

    static async reply() {
        if (!this.currentEmail) return;
        
        const replyData = {
            to: [{ email: this.currentEmail.sender_email, name: this.currentEmail.sender_name }],
            subject: this.currentEmail.subject.startsWith('Re: ') ? 
                     this.currentEmail.subject : 
                     `Re: ${this.currentEmail.subject}`,
            inReplyTo: this.currentEmail.id,
            originalBody: this.currentEmail.body_text || this.currentEmail.body_html
        };
        
        this.close();
        ComposeComponent.open(replyData);
    }

    static async replyAll() {
        if (!this.currentEmail) return;
        
        const recipients = [
            { email: this.currentEmail.sender_email, name: this.currentEmail.sender_name },
            ...(this.currentEmail.recipients || []),
            ...(this.currentEmail.cc_recipients || [])
        ];
        
        // Remove current user from recipients
        const currentUserEmail = window.app?.currentUser?.email;
        const filteredRecipients = recipients.filter(r => r.email !== currentUserEmail);
        
        const replyData = {
            to: filteredRecipients,
            subject: this.currentEmail.subject.startsWith('Re: ') ? 
                     this.currentEmail.subject : 
                     `Re: ${this.currentEmail.subject}`,
            inReplyTo: this.currentEmail.id,
            originalBody: this.currentEmail.body_text || this.currentEmail.body_html
        };
        
        this.close();
        ComposeComponent.open(replyData);
    }

    static async forward() {
        if (!this.currentEmail) return;
        
        const forwardData = {
            subject: this.currentEmail.subject.startsWith('Fwd: ') ? 
                     this.currentEmail.subject : 
                     `Fwd: ${this.currentEmail.subject}`,
            originalBody: this.currentEmail.body_text || this.currentEmail.body_html,
            forwardedFrom: this.currentEmail
        };
        
        this.close();
        ComposeComponent.open(forwardData);
    }

    static async toggleStar() {
        if (!this.currentEmail) return;
        
        try {
            const isStarred = this.currentEmail.is_starred;
            
            if (isStarred) {
                await EmailService.markAsUnstarred([this.currentEmail.id]);
                this.currentEmail.is_starred = false;
            } else {
                await EmailService.markAsStarred([this.currentEmail.id]);
                this.currentEmail.is_starred = true;
            }
            
            // Update button state
            const starBtn = document.querySelector('.email-actions .btn-icon[title="Star"]');
            if (starBtn) {
                starBtn.classList.toggle('starred', this.currentEmail.is_starred);
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

    static async delete() {
        if (!this.currentEmail) return;
        
        if (confirm('Delete this email?')) {
            try {
                await EmailService.deleteEmails([this.currentEmail.id]);
                this.close();
                
                if (window.app) {
                    await window.app.refreshEmails();
                }
                
                NotificationService.show('Email deleted', 'success');
            } catch (error) {
                console.error('Failed to delete email:', error);
                NotificationService.show('Failed to delete email', 'error');
            }
        }
    }

    static async markAsSpam() {
        if (!this.currentEmail) return;
        
        if (confirm('Mark this email as spam?')) {
            try {
                await EmailService.reportSpam([this.currentEmail.id]);
                this.close();
                
                if (window.app) {
                    await window.app.refreshEmails();
                }
                
                NotificationService.show('Marked as spam', 'success');
            } catch (error) {
                console.error('Failed to mark as spam:', error);
                NotificationService.show('Failed to mark as spam', 'error');
            }
        }
    }

    static async downloadAttachment(attachmentId) {
        if (!this.currentEmail) return;
        
        try {
            const blob = await EmailService.getAttachment(this.currentEmail.id, attachmentId);
            const attachment = this.currentEmail.attachments.find(a => a.id === attachmentId);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = attachment.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            NotificationService.show('Download started', 'success');
        } catch (error) {
            console.error('Failed to download attachment:', error);
            NotificationService.show('Failed to download attachment', 'error');
        }
    }

    static getFileIcon(filename) {
        const extension = filename.split('.').pop()?.toLowerCase();
        
        const iconMap = {
            pdf: '📄',
            doc: '📝', docx: '📝',
            xls: '📊', xlsx: '📊',
            ppt: '📊', pptx: '📊',
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
            mp4: '🎥', avi: '🎥', mov: '🎥',
            mp3: '🎵', wav: '🎵',
            zip: '📦', rar: '📦',
            txt: '📄'
        };
        
        return iconMap[extension] || '📎';
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static formatPlainText(text) {
        if (!text) return '';
        
        return text
            .replace(/\n/g, '<br>')
            .replace(/https?:\/\/[^\s]+/g, '<a href="$&" target="_blank">$&</a>');
    }

    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// UI Component for composing new emails
class ComposeComponent {
    static currentDraft = null;
    static attachments = [];

    static open(replyData = null) {
        this.currentDraft = null;
        this.attachments = [];
        this.renderModal(replyData);
        this.showModal();
    }

    static close() {
        const modal = document.getElementById('composeModal');
        modal.classList.add('hidden');
        this.currentDraft = null;
        this.attachments = [];
    }

    static renderModal(replyData = null) {
        const modal = document.getElementById('composeModal');
        if (!modal) {
            this.createModal();
            return this.renderModal(replyData);
        }

        const toEmails = replyData?.to ? replyData.to.map(r => r.email).join(', ') : '';
        const subject = replyData?.subject || '';
        const body = this.formatReplyBody(replyData);

        modal.innerHTML = `
            <div class="modal-content compose-content">
                <div class="modal-header">
                    <h2 class="modal-title">New Message</h2>
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="ComposeComponent.saveDraft()">
                            Save Draft
                        </button>
                        <button class="btn-icon" onclick="ComposeComponent.close()" title="Close">
                            ✕
                        </button>
                    </div>
                </div>
                
                <div class="modal-body">
                    <form id="composeForm" onsubmit="ComposeComponent.send(event)">
                        <div class="compose-fields">
                            <div class="compose-field">
                                <label for="composeTo">To:</label>
                                <input type="email" 
                                       id="composeTo" 
                                       name="to" 
                                       value="${this.escapeHtml(toEmails)}"
                                       placeholder="Recipients"
                                       multiple required>
                            </div>
                            
                            <div class="compose-field compose-cc hidden">
                                <label for="composeCc">CC:</label>
                                <input type="email" 
                                       id="composeCc" 
                                       name="cc" 
                                       placeholder="CC Recipients"
                                       multiple>
                            </div>
                            
                            <div class="compose-field compose-bcc hidden">
                                <label for="composeBcc">BCC:</label>
                                <input type="email" 
                                       id="composeBcc" 
                                       name="bcc" 
                                       placeholder="BCC Recipients"
                                       multiple>
                            </div>
                            
                            <div class="compose-field">
                                <label for="composeSubject">Subject:</label>
                                <input type="text" 
                                       id="composeSubject" 
                                       name="subject" 
                                       value="${this.escapeHtml(subject)}"
                                       placeholder="Subject" required>
                            </div>
                        </div>
                        
                        <div class="compose-toolbar">
                            <button type="button" class="btn-toolbar" onclick="ComposeComponent.toggleCc()">
                                CC
                            </button>
                            <button type="button" class="btn-toolbar" onclick="ComposeComponent.toggleBcc()">
                                BCC
                            </button>
                            <button type="button" class="btn-toolbar" onclick="ComposeComponent.attachFile()">
                                📎 Attach
                            </button>
                            <input type="file" 
                                   id="attachmentInput" 
                                   multiple 
                                   style="display: none"
                                   onchange="ComposeComponent.handleFileSelect(event)">
                        </div>
                        
                        <div id="attachmentsList" class="attachments-list"></div>
                        
                        <div class="compose-editor">
                            <textarea id="composeBody" 
                                      name="body" 
                                      placeholder="Compose your message..."
                                      rows="10" required>${body}</textarea>
                        </div>
                        
                        <div class="compose-actions">
                            <button type="submit" class="btn-primary">
                                <span class="btn-text">Send</span>
                                <span class="btn-loader hidden">⏳</span>
                            </button>
                            <button type="button" class="btn-secondary" onclick="ComposeComponent.saveDraft()">
                                Save Draft
                            </button>
                            <button type="button" class="btn-secondary" onclick="ComposeComponent.close()">
                                Discard
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    static createModal() {
        const modal = document.createElement('div');
        modal.id = 'composeModal';
        modal.className = 'modal hidden';
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.confirmClose();
            }
        };
        
        document.body.appendChild(modal);
    }

    static showModal() {
        const modal = document.getElementById('composeModal');
        modal.classList.remove('hidden');
        
        // Focus on To field
        document.getElementById('composeTo').focus();
        
        // Add keyboard listeners
        this.addKeyboardListeners();
    }

    static addKeyboardListeners() {
        const handler = (e) => {
            if (e.key === 'Escape') {
                this.confirmClose();
                document.removeEventListener('keydown', handler);
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.send(e);
            }
        };
        
        document.addEventListener('keydown', handler);
    }

    static confirmClose() {
        const hasContent = this.hasContent();
        
        if (hasContent) {
            if (confirm('Discard this message?')) {
                this.close();
            }
        } else {
            this.close();
        }
    }

    static hasContent() {
        const to = document.getElementById('composeTo')?.value.trim();
        const subject = document.getElementById('composeSubject')?.value.trim();
        const body = document.getElementById('composeBody')?.value.trim();
        
        return !!(to || subject || body || this.attachments.length > 0);
    }

    static async send(event) {
        event.preventDefault();
        
        const form = document.getElementById('composeForm');
        const formData = new FormData(form);
        const sendBtn = form.querySelector('button[type="submit"]');
        const btnText = sendBtn.querySelector('.btn-text');
        const btnLoader = sendBtn.querySelector('.btn-loader');
        
        try {
            sendBtn.disabled = true;
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            
            const emailData = {
                to: this.parseEmails(formData.get('to')),
                cc: this.parseEmails(formData.get('cc')),
                bcc: this.parseEmails(formData.get('bcc')),
                subject: formData.get('subject'),
                body: formData.get('body'),
                attachments: this.attachments
            };
            
            await EmailService.sendEmail(emailData);
            
            this.close();
            NotificationService.show('Email sent successfully!', 'success');
            
            // Refresh email list
            if (window.app) {
                await window.app.refreshEmails();
            }
            
        } catch (error) {
            console.error('Failed to send email:', error);
            NotificationService.show('Failed to send email', 'error');
        } finally {
            sendBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }

    static async saveDraft() {
        const form = document.getElementById('composeForm');
        const formData = new FormData(form);
        
        try {
            const draftData = {
                to: this.parseEmails(formData.get('to')),
                cc: this.parseEmails(formData.get('cc')),
                bcc: this.parseEmails(formData.get('bcc')),
                subject: formData.get('subject'),
                body: formData.get('body'),
                attachments: this.attachments
            };
            
            if (this.currentDraft) {
                await EmailService.updateDraft(this.currentDraft.id, draftData);
            } else {
                this.currentDraft = await EmailService.saveDraft(draftData);
            }
            
            NotificationService.show('Draft saved', 'success');
        } catch (error) {
            console.error('Failed to save draft:', error);
            NotificationService.show('Failed to save draft', 'error');
        }
    }

    static toggleCc() {
        const field = document.querySelector('.compose-cc');
        field.classList.toggle('hidden');
        if (!field.classList.contains('hidden')) {
            document.getElementById('composeCc').focus();
        }
    }

    static toggleBcc() {
        const field = document.querySelector('.compose-bcc');
        field.classList.toggle('hidden');
        if (!field.classList.contains('hidden')) {
            document.getElementById('composeBcc').focus();
        }
    }

    static attachFile() {
        document.getElementById('attachmentInput').click();
    }

    static handleFileSelect(event) {
        const files = Array.from(event.target.files);
        
        files.forEach(file => {
            this.attachments.push({
                file: file,
                name: file.name,
                size: file.size,
                type: file.type
            });
        });
        
        this.renderAttachments();
        event.target.value = ''; // Reset input
    }

    static renderAttachments() {
        const container = document.getElementById('attachmentsList');
        
        container.innerHTML = this.attachments.map((attachment, index) => `
            <div class="attachment-item">
                <span class="attachment-icon">${this.getFileIcon(attachment.name)}</span>
                <span class="attachment-name">${this.escapeHtml(attachment.name)}</span>
                <span class="attachment-size">${this.formatFileSize(attachment.size)}</span>
                <button type="button" 
                        class="btn-icon attachment-remove" 
                        onclick="ComposeComponent.removeAttachment(${index})"
                        title="Remove">
                    ✕
                </button>
            </div>
        `).join('');
    }

    static removeAttachment(index) {
        this.attachments.splice(index, 1);
        this.renderAttachments();
    }

    static parseEmails(emailString) {
        if (!emailString) return [];
        
        return emailString
            .split(',')
            .map(email => email.trim())
            .filter(email => email.length > 0)
            .map(email => ({ email }));
    }

    static formatReplyBody(replyData) {
        if (!replyData?.originalBody) return '';
        
        const divider = '\n\n--- Original Message ---\n';
        return divider + replyData.originalBody;
    }

    static getFileIcon(filename) {
        return EmailViewComponent.getFileIcon(filename);
    }

    static formatFileSize(bytes) {
        return EmailViewComponent.formatFileSize(bytes);
    }

    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EmailViewComponent,
        ComposeComponent
    };
}