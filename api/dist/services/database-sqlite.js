"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteDatabase = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const logger_1 = require("../utils/logger");
const path_1 = __importDefault(require("path"));
class SqliteDatabase {
    static async initialize() {
        try {
            const dbPath = path_1.default.join(process.cwd(), 'bhamail.db');
            this.instance = new better_sqlite3_1.default(dbPath);
            // Enable foreign keys
            this.instance.pragma('foreign_keys = ON');
            // Create tables
            this.createTables();
            logger_1.logger.info('SQLite database connection established at:', dbPath);
        }
        catch (error) {
            logger_1.logger.error('SQLite database connection failed:', error);
            throw error;
        }
    }
    static createTables() {
        const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        avatar_url TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
        const createFoldersTable = `
      CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'custom',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
        const createEmailsTable = `
      CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        folder_id INTEGER NOT NULL,
        from_email TEXT NOT NULL,
        to_emails TEXT NOT NULL,
        cc_emails TEXT,
        bcc_emails TEXT,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_starred BOOLEAN DEFAULT FALSE,
        is_important BOOLEAN DEFAULT FALSE,
        received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (folder_id) REFERENCES folders(id)
      )
    `;
        const createAttachmentsTable = `
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (email_id) REFERENCES emails(id)
      )
    `;
        this.instance.exec(createUsersTable);
        this.instance.exec(createFoldersTable);
        this.instance.exec(createEmailsTable);
        this.instance.exec(createAttachmentsTable);
        logger_1.logger.info('SQLite tables created/verified');
    }
    static getInstance() {
        if (!this.instance) {
            throw new Error('Database not initialized. Call SqliteDatabase.initialize() first.');
        }
        return this.instance;
    }
    static async close() {
        if (this.instance) {
            this.instance.close();
            logger_1.logger.info('SQLite database connection closed');
        }
    }
    static transaction(callback) {
        const db = this.getInstance();
        const transaction = db.transaction(callback);
        return transaction(db);
    }
    // Seed initial data
    static seedInitialData() {
        const db = this.getInstance();
        // Create demo user
        const createUser = db.prepare(`
      INSERT OR IGNORE INTO users (email, password, first_name, last_name, is_verified)
      VALUES (?, ?, ?, ?, ?)
    `);
        createUser.run('demo@bhamail.com', '$2b$12$LQv3c1yqBwEHzD/W6sgsVu3Q9mQlqf9A1bOiQBbGhZnLXf.LfzLIK', 'Demo', 'User', true);
        // Get user ID
        const user = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@bhamail.com');
        if (user) {
            // Create default folders
            const createFolder = db.prepare(`
        INSERT OR IGNORE INTO folders (user_id, name, type)
        VALUES (?, ?, ?)
      `);
            createFolder.run(user.id, 'Inbox', 'inbox');
            createFolder.run(user.id, 'Sent', 'sent');
            createFolder.run(user.id, 'Drafts', 'drafts');
            createFolder.run(user.id, 'Spam', 'spam');
            createFolder.run(user.id, 'Trash', 'trash');
            // Get inbox folder
            const inbox = db.prepare('SELECT id FROM folders WHERE user_id = ? AND type = ?').get(user.id, 'inbox');
            if (inbox) {
                // Create sample emails
                const createEmail = db.prepare(`
          INSERT OR IGNORE INTO emails (user_id, folder_id, from_email, to_emails, subject, body, is_read)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
                createEmail.run(user.id, inbox.id, 'welcome@bhamail.com', 'demo@bhamail.com', 'Welcome to BhaMail! 🎉', 'Thank you for trying BhaMail. This is your local development environment with SQLite database. All features are now working without Docker!', false);
                createEmail.run(user.id, inbox.id, 'github@noreply.github.com', 'demo@bhamail.com', '[GitHub] Your repository BhaMail has been updated', 'New commits have been pushed to your repository. The latest changes include SQLite integration for local development.', false);
                createEmail.run(user.id, inbox.id, 'newsletter@techdigest.com', 'demo@bhamail.com', 'Weekly Tech News Digest', 'Latest updates in web development, AI, and open source projects. This week: SQLite alternatives to Docker, local development tips, and more.', true);
            }
        }
        logger_1.logger.info('Initial data seeded to SQLite database');
    }
}
exports.SqliteDatabase = SqliteDatabase;
//# sourceMappingURL=database-sqlite.js.map
