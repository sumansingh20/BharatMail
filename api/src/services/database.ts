import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export class Database {
  private static instance: Pool;

  static async initialize(): Promise<void> {
    try {
      this.instance = new Pool({
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

      logger.info('Database connection established');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  static getInstance(): Pool {
    if (!this.instance) {
      throw new Error('Database not initialized. Call Database.initialize() first.');
    }
    return this.instance;
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.end();
      logger.info('Database connection closed');
    }
  }

  static async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getInstance().connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}