import { MemorySessionStore } from './memory-strategy';
import { DatabaseSessionStore } from './database-strategy';
import { JWTManager } from './jwt-manager';

/**
* Authentication service for managing user sessions and JWT tokens
* @class AuthService
*/
export class AuthService {
    /**
    * @private instance - The singleton instance of the AuthService
    * @private sessionStore - The session store for the authentication
    * @private jwtManager - The JWT manager for generating and verifying JWT tokens
    * @private settings - The settings for the authentication
    */
    private static instance: AuthService;
    private sessionStore!: AuthModule.SessionStore;
    private jwtManager: JWTManager;
    private settings: AuthModule.Settings;

    private constructor(settings: AuthModule.Settings) {
        this.settings = settings;
        this.initializeSessionStore();
        this.jwtManager = new JWTManager(
            settings.tokenSecret,
            settings.tokenAlgorithm,
            settings.tokenExpiration
        );
    }

    private initializeSessionStore(): void {
        switch (this.settings.currentStrategy) {
            case 'memory':
                this.sessionStore = new MemorySessionStore(
                    this.settings.strategies.memory.maxSessionSize
                );
                break;
            case 'database':
                this.sessionStore = new DatabaseSessionStore(
                    this.settings.strategies.database.useDbCache,
                    this.settings.strategies.database.cacheDuration,
                    this.settings.strategies.database.cacheSizeMax
                );
                break;
            default:
                throw new Error(`Unknown session strategy: ${this.settings.currentStrategy}`);
        }
    }

    public static initialize(settings: AuthModule.Settings): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService(settings);
        }
        return AuthService.instance;
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            throw new Error('AuthService must be initialized first');
        }
        return AuthService.instance;
    }
    // Session management methods

    /**
    * Create a new session
    * @param sessionId - The ID of the session
    * @param data - The data to store in the session
    */
    public async createSession(sessionId: string, data: AuthModule.SessionData): Promise<void> {
        const token = this.jwtManager.generateToken(data);
        this.sessionStore.set(sessionId, {...data, token});
    }
    
    /**
    * Get a session
    * @param sessionId - The ID of the session
    * @returns {Promise<AuthModule.SessionData | null>} The session data
    */
    public async getSession(sessionId: string): Promise<AuthModule.SessionData | null> {
        return this.sessionStore.get(sessionId);
    }

    /**
    * Check if a session is valid
    * @param sessionId - The ID of the session
    * @returns {Promise<boolean>} Whether the session is valid
    */
    public async isValidSession(sessionId: string): Promise<boolean> {
        const exist = await this.sessionStore.isValid(sessionId);
        if (!exist) {
            return false;
        }
        

        const session = await this.getSession(sessionId);
        if (!session) {
            return false;
        }

        const verified = this.jwtManager.verifyToken(session.token);
        if (!verified) {
            return false;
        }

        return true;
    }

    /**
    * Destroy a session
    * @param sessionId - The ID of the session
    */  
    public destroySession(sessionId: string): void {
        this.sessionStore.delete(sessionId);
    }
}