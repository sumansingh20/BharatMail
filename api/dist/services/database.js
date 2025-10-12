"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const pg_1 = require("pg");
const logger_1 = require("../utils/logger");
class Database {
    static async initialize() {
        try {
            this.instance = new pg_1.Pool({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                database: process.env.DB_NAME || 'bhamail',
                user: process.env.DB_USER || 'bhamail',
                password: process.env.DB_PASSWORD || 'bhamail123',
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });
            // Test connection
            const client = await this.instance.connect();
            await client.query('SELECT NOW()');
            client.release();
            logger_1.logger.info('Database connection established');
        }
        catch (error) {
            logger_1.logger.error('Database connection failed:', error);
            throw error;
        }
    }
    static getInstance() {
        if (!this.instance) {
            throw new Error('Database not initialized. Call Database.initialize() first.');
        }
        return this.instance;
    }
    static async close() {
        if (this.instance) {
            await this.instance.end();
            logger_1.logger.info('Database connection closed');
        }
    }
    static async transaction(callback) {
        const client = await this.getInstance().connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.Database = Database;
//# sourceMappingURL=database.js.map