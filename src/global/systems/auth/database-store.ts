import { pool } from "../../database/db.config";
import { DTO } from "../DTO";

export class DatabaseSessionStore implements AuthModule.SessionStore {
    private cache?: Map<string, AuthModule.SessionData>;
    private validUntil!: Date;
    private currentCacheSize: number = 0;
    private maxSize: number = 0;
    
    constructor(
        private useCache: boolean,
        private cacheDuration: string,
        cacheSizeMax: number
    ) {
        if (useCache) {
            this.cache = new Map();
            this.validUntil = new Date(Date.now() + this.parseDuration(cacheDuration));
            this.maxSize = cacheSizeMax;
        }
    }

    private parseDuration(duration: string): number {
        const unit = duration.slice(-1);
        const value = parseInt(duration.slice(0, -1));
        
        switch(unit) {
            case 'h': return value * 60 * 60 * 1000;
            case 'm': return value * 60 * 1000;
            case 's': return value * 1000;
            // row to 1 h cache
            default: return 60 * 60 * 1000;
        }
    }

    private manageCache(sessionId: string, data: AuthModule.SessionData): void {
        if (!this.useCache || !this.cache) {
            return;
        }

        // Check if cache expired
        if (Date.now() > this.validUntil.getTime()) {
            this.cache.clear();
            this.currentCacheSize = 0;
            this.validUntil = new Date(Date.now() + this.parseDuration(this.cacheDuration));
        }

        const sessionSize = JSON.stringify(data).length;

        // If adding would exceed max size, remove oldest entries
        while (this.currentCacheSize + sessionSize > this.maxSize && this.cache.size > 0) {
            const oldestKey = this.cache.keys().next().value as string;
            const oldestSize = JSON.stringify(this.cache.get(oldestKey)).length;
            this.cache.delete(oldestKey);
            this.currentCacheSize -= oldestSize;
        }

        this.cache.set(sessionId, data);
        this.currentCacheSize += sessionSize;
    }

    async set(sessionId: string, data: AuthModule.SessionData): Promise<void> {
        const connection = await pool.getConnection();
        try {
            const dto = new DTO({
                connection,
                query: `
                    INSERT INTO sessions (session_id, user_id, created_at, expires_at)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                    user_id = VALUES(user_id),
                    created_at = VALUES(created_at),
                    expires_at = VALUES(expires_at)
                `,
                values: [sessionId, data.userId, data.createdAt, data.expiresAt]
            });

            const result = await dto.execute();
            if (!result.success) {
                throw new Error('Failed to save session');
            }

            this.manageCache(sessionId, data);
        } finally {
            connection.release();
        }
    }

    async get(sessionId: string): Promise<AuthModule.SessionData | null> {
        // Check cache first if enabled
        if (this.useCache && this.cache?.has(sessionId)) {
            const cachedSession = this.cache.get(sessionId)!;
            if (new Date() > cachedSession.expiresAt) {
                await this.delete(sessionId);
                return null;
            }
            return cachedSession;
        }

        const connection = await pool.getConnection();
        try {
            const dto = new DTO({
                connection,
                query: 'SELECT * FROM sessions WHERE session_id = ? AND expires_at > NOW()',
                values: [sessionId]
            });

            const result = await dto.execute();
            if (!result.success || !result.data) {
                return null;
            }

            const session: AuthModule.SessionData = {
                userId: result.data[0].user_id,
                createdAt: new Date(result.data[0].created_at),
                expiresAt: new Date(result.data[0].expires_at)
            };

            if (this.useCache) {
                this.cache?.set(sessionId, session);
            }

            return session;
        } finally {
            connection.release();
        }
    }

    async delete(sessionId: string): Promise<void> {
        if (this.useCache) {
            this.cache?.delete(sessionId);
        }

        const connection = await pool.getConnection();
        try {
            const dto = new DTO({
                connection,
                query: 'DELETE FROM sessions WHERE session_id = ?',
                values: [sessionId]
            });

            await dto.execute();
        } finally {
            connection.release();
        }
    }

    async isValid(sessionId: string): Promise<boolean> {
        const session = await this.get(sessionId);
        return session !== null;
    }
}