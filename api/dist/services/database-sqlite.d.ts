import Database from 'better-sqlite3';
export declare class SqliteDatabase {
    private static instance;
    static initialize(): Promise<void>;
    private static createTables;
    static getInstance(): Database.Database;
    static close(): Promise<void>;
    static transaction<T>(callback: (db: Database.Database) => T): T;
    static seedInitialData(): void;
}
//# sourceMappingURL=database-sqlite.d.ts.map