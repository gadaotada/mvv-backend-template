declare global {
    namespace AuthModule {
        interface SessionData {
            userId: number;
            roles: string[];
            createdAt: Date;
            expiresAt: Date;
        }
        
        interface SessionStore {
            set(sessionId: string, data: SessionData): Promise<void>;
            get(sessionId: string): Promise<SessionData | null>;
            delete(sessionId: string): Promise<void>;
            isValid(sessionId: string): Promise<boolean>;
        }
        
        interface AuthConfig {
            sessionStorage: {
                strategies: {
                    memory: {
                        enabled: boolean;
                        sessionDuration: string;
                        maxSizeInBytes: number;
                    };
                    database: {
                        enabled: boolean;
                        useDbCache: boolean;
                        cacheDuration: string;
                        cacheSizeInBytes: number;
                    };
                };
                tokenExpiration: string;
                tokenLength: number;
                tokenAlgorithm: "HS256" | "RS256" | "ES256";
                tokenSecret: string;
            };
        }
    }
}
export {};