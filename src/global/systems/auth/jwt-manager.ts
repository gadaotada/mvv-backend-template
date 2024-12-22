import { createHash, randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { AuthSystem } from './index';

/**
* Singleton class for managing JWT sessions
* @class JWTSessionManager
*/
export class JWTSessionManager {
    /**
    * @private instance - The singleton instance of JWTSessionManager
    * @private store - The session store for the authentication system
    * @private config - The configuration for the authentication system
    */
    private static instance: JWTSessionManager | undefined;
    private store!: AuthModule.SessionStore;
    private config!: AuthModule.AuthConfig['sessionStorage'];

    constructor(config: AuthModule.AuthConfig['sessionStorage']) {
        if (JWTSessionManager.instance) {
            return JWTSessionManager.instance;
        }

        this.config = config;
        this.store = new AuthSystem({ sessionStorage: config }).getSessionStore();
        JWTSessionManager.instance = this;
    }

    /**
    * Get the singleton instance of JWTSessionManager
    * @returns {JWTSessionManager} The singleton instance
    */
    static getInstance(): JWTSessionManager {
        if (!JWTSessionManager.instance) {
            throw new Error('JWTSessionManager has not been initialized');
        }
        return JWTSessionManager.instance;
    }

    /**
    * Reset the singleton instance of JWTSessionManager
    */
    static resetInstance(): void {
        JWTSessionManager.instance = undefined;
    }

    /**
    * Create a new session for a user
    * @param userId - The ID of the user
    * @param roles - The roles of the user
    * @returns {Promise<string>} The JWT token for the session
    */
    async createSession(userId: number, roles: string[] = []): Promise<string> {
        const sessionId = this.generateSessionId();
        const expiresAt = new Date(Date.now() + this.parseDuration(this.config.tokenExpiration));

        const sessionData: AuthModule.SessionData = {
            userId,
            roles,
            createdAt: new Date(),
            expiresAt
        };

        await this.store.set(sessionId, sessionData);

        return this.generateToken(sessionId);
    }

    /**
    * Validate a session token
    * @param token - The JWT token
    * @returns {Promise<AuthModule.SessionData | null>} The session data or null if invalid
    */
    async validateSession(token: string): Promise<AuthModule.SessionData | null> {
        try {
            const sessionId = this.verifyToken(token);
            if (!sessionId) {
                return null;
            }

            const session = await this.store.get(sessionId);
            
            if (!session) {
                return null;
            }

            return session;
        } catch {
            return null;
        }
    }

    /**
    * Invalidate a session token
    * @param token - The JWT token
    */
    async invalidateSession(token: string): Promise<void> {
        try {
            const sessionId = this.verifyToken(token);
            if (sessionId) {
                await this.store.delete(sessionId);
            }
        } catch {
            // Token invalid, nothing to invalidate ha-ha :D
        }
    }

    /**
    * Check if a user has a specific role
    * @param token - The JWT token
    * @param role - The role to check for
    * @returns {Promise<boolean>} Whether the user has the role
    */
    async hasRole(token: string, role: string): Promise<boolean> {
        const session = await this.validateSession(token);
        return session?.roles?.includes(role) ?? false;
    }

    /**
    * Check if a user has a specific permission
    * @param token - The JWT token
    * @param permission - The permission to check for
    * @param resourceOwnerId - The ID of the resource owner (optional)
    * @returns {Promise<boolean>} Whether the user has the permission
    */
    async hasPermission(token: string, permission: string, resourceOwnerId?: number): Promise<boolean> {
        const session = await this.validateSession(token);
        if (!session?.roles || !this.config.rbac.enabled) {
            return false;
        }

        for (const userRole of session.roles) {
            const roleConfig = this.config.rbac.roles[userRole];
            if (!roleConfig?.permissions) {
                continue;
            }

            // Check for wildcard permission
            if (roleConfig.permissions.includes('*')) {
                return true;
            }
            // Split the permission into parts
            const [resource, action] = permission.split(':');
            
            // Check for :any permission
            if (roleConfig.permissions.includes(`${resource}:${action}:any`)) {
                return true;
            }

            // Check for :own permission if resourceOwnerId is provided
            if (resourceOwnerId !== undefined && 
                roleConfig.permissions.includes(`${resource}:${action}:own`) && 
                resourceOwnerId === session.userId) {
                return true;
            }
        }

        return false;
    }

    /**
    * Get the roles of a user
    * @param token - The JWT token
    * @returns {Promise<string[]>} The roles of the user
    */
    async getRoles(token: string): Promise<string[]> {
        const session = await this.validateSession(token);
        return session?.roles ?? [];
    }

    /**
    * Assign a role to a user
    * @param token - The JWT token
    * @param role - The role to assign
    * @returns {Promise<boolean>} Whether the role was assigned
    */
    async assignRole(token: string, role: string): Promise<boolean> {
        try {
            const sessionId = this.verifyToken(token);
            if (!sessionId) {
                return false;
            }

            const session = await this.store.get(sessionId);
            if (!session) {
                return false;
            }

            // Check if role exists in config
            if (!this.config.rbac.roles[role]) {
                return false;
            }
            // Add role if it doesn't exist
            if (!session.roles) {
                session.roles = [];
            }

            if (!session.roles.includes(role)) {
                session.roles.push(role);
                await this.store.set(sessionId, session);
            }

            return true;
        } catch {
            return false;
        }
    }

    /**
    * Remove a role from a user
    * @param token - The JWT token
    * @param role - The role to remove
    * @returns {Promise<boolean>} Whether the role was removed
    */
    async removeRole(token: string, role: string): Promise<boolean> {
        try {
            const sessionId = this.verifyToken(token);
            if (!sessionId) {
                return false;
            }

            const session = await this.store.get(sessionId);
            if (!session?.roles) {
                return false;
            }

            const index = session.roles.indexOf(role);
            if (index > -1) {
                session.roles.splice(index, 1);
                await this.store.set(sessionId, session);
                return true;
            }

            return false;
        } catch {
            return false;
        }
    }

    /**
    * Generate a session ID
    * @returns {string} The session ID
    */
    private generateSessionId(): string {
        return createHash('sha256')
            .update(randomBytes(this.config.tokenLength))
            .digest('hex');
    }

    /**
    * Generate a JWT token for a session
    * @param sessionId - The session ID
    * @returns {string} The JWT token
    */
    private generateToken(sessionId: string): string {
        return jwt.sign({ sid: sessionId }, this.config.tokenSecret, {
            algorithm: this.config.tokenAlgorithm,
            expiresIn: this.config.tokenExpiration
        });
    }

    /**
    * Verify a JWT token
    * @param token - The JWT token
    * @returns {string | null} The session ID or null if invalid
    */
    private verifyToken(token: string): string | null {
        try {
            const decoded = jwt.verify(token, this.config.tokenSecret) as jwt.JwtPayload;
            return decoded.sid;
        } catch {
            return null;
        }
    }

    /**
    * Parse a duration string into milliseconds
    * @param duration - The duration string
    * @returns {number} The duration in milliseconds
    */
    private parseDuration(duration: string): number {
        const unit = duration.slice(-1);
        const value = parseInt(duration.slice(0, -1));
        
        switch(unit) {
            case 'h': return value * 60 * 60 * 1000;
            case 'm': return value * 60 * 1000;
            case 's': return value * 1000;
            default: return 24 * 60 * 60 * 1000; // Default 24h
        }
    }
} 