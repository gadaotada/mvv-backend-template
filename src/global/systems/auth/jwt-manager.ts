import { createHash, randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { AuthSystem } from './index';

export class JWTSessionManager {
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

    static getInstance(): JWTSessionManager {
        if (!JWTSessionManager.instance) {
            throw new Error('JWTSessionManager has not been initialized');
        }
        return JWTSessionManager.instance;
    }

    static resetInstance(): void {
        JWTSessionManager.instance = undefined;
    }

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

    async hasRole(token: string, role: string): Promise<boolean> {
        const session = await this.validateSession(token);
        return session?.roles?.includes(role) ?? false;
    }

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

    async getRoles(token: string): Promise<string[]> {
        const session = await this.validateSession(token);
        return session?.roles ?? [];
    }

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

    private generateSessionId(): string {
        return createHash('sha256')
            .update(randomBytes(this.config.tokenLength))
            .digest('hex');
    }

    private generateToken(sessionId: string): string {
        return jwt.sign({ sid: sessionId }, this.config.tokenSecret, {
            algorithm: this.config.tokenAlgorithm,
            expiresIn: this.config.tokenExpiration
        });
    }

    private verifyToken(token: string): string | null {
        try {
            const decoded = jwt.verify(token, this.config.tokenSecret) as jwt.JwtPayload;
            return decoded.sid;
        } catch {
            return null;
        }
    }

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