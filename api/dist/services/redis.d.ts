import Redis from 'redis';
export declare class RedisService {
    private static client;
    static initialize(): Promise<void>;
    static getClient(): Redis.RedisClientType;
    static close(): Promise<void>;
    static set(key: string, value: string, expireInSeconds?: number): Promise<void>;
    static get(key: string): Promise<string | null>;
    static del(key: string): Promise<void>;
    static exists(key: string): Promise<boolean>;
}
//# sourceMappingURL=redis.d.ts.map