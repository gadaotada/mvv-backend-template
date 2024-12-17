declare global {
    namespace AuthModule {
        interface SessionData {
            userId: number;
            createdAt: Date;
            expiresAt: Date;
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

        type Permission = string;  // e.g., "users:read", "posts:write"
        
        interface Role {
            name: string;
            permissions: Permission[];
            inherits?: string[];  // Inherit permissions from other roles
        }

        interface RBACConfig {
            roles: Record<string, Role>;
            hierarchy?: boolean;  // Enable role inheritance
            cacheEnabled?: boolean;
            cacheDuration?: string;
        }

        interface RBACProvider {
            hasPermission(userId: number, permission: Permission): Promise<boolean>;
            hasRole(userId: number, role: string): Promise<boolean>;
            getUserRoles(userId: number): Promise<string[]>;
            getUserPermissions(userId: number): Promise<Permission[]>;
            assignRole(userId: number, role: string): Promise<void>;
            removeRole(userId: number, role: string): Promise<void>;
        }
    }
}
export {};