import { createHash, randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { AuthSystem } from './index';

export class JWTSessionManager {
    private static instance: JWTSessionManager;
    private store!: AuthModule.SessionStore;
    private tokenConfig!: AuthModule.AuthConfig['sessionStorage'];

    constructor(config: AuthModule.AuthConfig['sessionStorage']) {
        if (JWTSessionManager.instance) {
            return JWTSessionManager.instance;
        }

        this.tokenConfig = config;
        this.store = new AuthSystem({ sessionStorage: config }).getSessionStore();
        JWTSessionManager.instance = this;
    }

    static getInstance(): JWTSessionManager {
        if (!JWTSessionManager.instance) {
            throw new Error('JWTSessionManager has not been initialized');
        }
        return JWTSessionManager.instance;
    }

    async createSession(userId: number): Promise<string> {
        const sessionId = this.generateSessionId();
        const expiresAt = new Date(Date.now() + this.parseDuration(this.tokenConfig.tokenExpiration));

        const sessionData: AuthModule.SessionData = {
            userId,
            createdAt: new Date(),
            expiresAt
        };

        await this.store.set(sessionId, sessionData);

        return this.generateToken(sessionId);
    }

    async validateSession(token: string): Promise<AuthModule.SessionData | null> {
        try {
            const sessionId = this.verifyToken(token);
            if (!sessionId) return null;

            return await this.store.get(sessionId);
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

    private generateSessionId(): string {
        return createHash('sha256')
            .update(randomBytes(this.tokenConfig.tokenLength))
            .digest('hex');
    }

    private generateToken(sessionId: string): string {
        return jwt.sign({ sid: sessionId }, this.tokenConfig.tokenSecret, {
            algorithm: this.tokenConfig.tokenAlgorithm,
            expiresIn: this.tokenConfig.tokenExpiration
        });
    }

    private verifyToken(token: string): string | null {
        try {
            const decoded = jwt.verify(token, this.tokenConfig.tokenSecret) as jwt.JwtPayload;
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