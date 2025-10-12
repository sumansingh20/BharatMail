"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = __importDefault(require("redis"));
const logger_1 = require("../utils/logger");
class RedisService {
    static async initialize() {
        try {
            this.client = redis_1.default.createClient({
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                },
                password: process.env.REDIS_PASSWORD || undefined,
            });
            this.client.on('error', (err) => {
                logger_1.logger.error('Redis Client Error:', err);
            });
            this.client.on('connect', () => {
                logger_1.logger.info('Redis client connected');
            });
            await this.client.connect();
        }
        catch (error) {
            logger_1.logger.error('Redis connection failed:', error);
            throw error;
        }
    }
    static getClient() {
        if (!this.client) {
            throw new Error('Redis not initialized. Call RedisService.initialize() first.');
        }
        return this.client;
    }
    static async close() {
        if (this.client) {
            await this.client.quit();
            logger_1.logger.info('Redis connection closed');
        }
    }
    // Utility methods
    static async set(key, value, expireInSeconds) {
        const client = this.getClient();
        if (expireInSeconds) {
            await client.setEx(key, expireInSeconds, value);
        }
        else {
            await client.set(key, value);
        }
    }
    static async get(key) {
        const client = this.getClient();
        return await client.get(key);
    }
    static async del(key) {
        const client = this.getClient();
        await client.del(key);
    }
    static async exists(key) {
        const client = this.getClient();
        const result = await client.exists(key);
        return result === 1;
    }
}
exports.RedisService = RedisService;
//# sourceMappingURL=redis.js.map