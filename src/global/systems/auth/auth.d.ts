declare namespace AuthModule {
    interface AppUser {
        id: string;
    }

    interface SessionData {
        userId: string;
        token: string;
        createdAt: Date;
        expiresAt: Date;
    }

    interface SessionStore {
        set(sessionId: string, data: SessionData): Promise<void> | void;
        get(sessionId: string): Promise<SessionData | null> | SessionData | null;
        delete(sessionId: string): Promise<void> | void;
        isValid(sessionId: string): Promise<boolean> | boolean;
    }

    interface Settings {
        currentStrategy: 'memory' | 'database';
        strategies: {
            memory: {
                maxSessionSize: number;
            };
            database: {
                useDbCache: boolean;
                cacheDuration: string;
                cacheSizeMax: number;
            };
        };
        tokenExpiration: string;
        tokenLength: number;
        tokenAlgorithm: 'HS256' | 'HS384' | 'HS512';
        tokenSecret: string;
        rbac: {
            enabled: boolean;
            roles: Record<string, {
                permissions: string[];
                inherits?: string[];
                description: string;
            }>;
        };
    }
} 