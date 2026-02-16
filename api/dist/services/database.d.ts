import { Pool, PoolClient } from 'pg';
export declare class Database {
    private static instance;
    static initialize(): Promise<void>;
    static getInstance(): Pool;
    static close(): Promise<void>;
    static transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
}
//# sourceMappingURL=database.d.ts.map