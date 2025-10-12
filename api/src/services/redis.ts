import Redis from 'redis';
import { logger } from '../utils/logger';

export class RedisService {
  private static client: Redis.RedisClientType;

  static async initialize(): Promise<void> {
    try {
      this.client = Redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        password: process.env.REDIS_PASSWORD || undefined,
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  static getClient(): Redis.RedisClientType {
    if (!this.client) {
      throw new Error('Redis not initialized. Call RedisService.initialize() first.');
    }
    return this.client;
  }

  static async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis connection closed');
    }
  }

  // Utility methods
  static async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    const client = this.getClient();
    if (expireInSeconds) {
      await client.setEx(key, expireInSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  static async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return await client.get(key);
  }

  static async del(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  static async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.exists(key);
    return result === 1;
  }
}