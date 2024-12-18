declare global {
    namespace AuthModule {
        interface SessionData {
            userId: number;
            createdAt: Date;
            expiresAt: Date;
            roles?: string[];
        }
        
        interface SessionStore {
            set(sessionId: string, data: SessionData): void | Promise<void>;
            get(sessionId: string): SessionData | null | Promise<SessionData | null>;
            delete(sessionId: string): void | Promise<void>;
            isValid(sessionId: string): boolean | Promise<boolean>;
        }
        
        interface AuthConfig {
            sessionStorage: {
                strategies: {
                    memory: {
                        enabled: boolean;
                        maxSessionSize: number;
                    };
                    database: {
                        enabled: boolean;
                        useDbCache: boolean;
                        cacheDuration: string;
                        cacheSizeMax: number;
                    };
                };
                tokenExpiration: string;
                tokenLength: number;
                tokenAlgorithm: "HS256" | "RS256" | "ES256";
                tokenSecret: string;
                rbac: RBACConfig;
            };
        }
        
        interface Role {
            name: string;
            permissions: Permission[];
            inherits?: string[];  // Inherit permissions from other roles
        }

        interface RBACConfig {
            enabled: boolean;
            roles: {
                [key: string]: {
                    permissions?: string[];
                    inherits?: string[];
                };
            };
        }
    }
}
export {};