/**
* Memory session store for authentication
* @class MemorySessionStore
* @implements {AuthModule.SessionStore}
*/
export class MemorySessionStore implements AuthModule.SessionStore {
    /**
    * @private sessions - The map of sessions
    * @private currentSize - The current size of the sessions
    * @private maxSize - The maximum size of the sessions
    */
    private sessions: Map<string, AuthModule.SessionData> = new Map();
    private currentSize: number = 0;
    private maxSize: number;

    constructor(maxSessionSize: number) {
        this.maxSize = maxSessionSize;
    }

    /**
    * Set a session in the store
    * @param sessionId - The ID of the session
    * @param data - The session data
    */
    set(sessionId: string, data: AuthModule.SessionData): void {
        const sessionSize = JSON.stringify(data).length;

        // Check if adding this session would exceed max size set in the settings
        if (this.currentSize + sessionSize > this.maxSize) {
            // Remove expired sessions first
            this.cleanup();
            
            // If still not enough space, clean the oldest session
            if (this.currentSize + sessionSize > this.maxSize) {
                this.sessions.delete(this.sessions.keys().next().value as string);
            }
        }

        this.sessions.set(sessionId, data);
        this.currentSize += sessionSize;
    }

    /**
    * Get a session from the store
    * @param sessionId - The ID of the session
    * @returns {AuthModule.SessionData | null} The session data or null if not found
    */
    get(sessionId: string): AuthModule.SessionData | null {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            return null;
        }

        // Check if session has expired
        if (new Date() > session.expiresAt) {
            this.delete(sessionId);
            return null;
        }

        return session;
    }

    /**
    * Delete a session from the store
    * @param sessionId - The ID of the session
    */
    delete(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            const sessionSize = JSON.stringify(session).length;
            this.sessions.delete(sessionId);
            this.currentSize -= sessionSize;
        }
    }

    /**
    * Check if a session is valid
    * @param sessionId - The ID of the session
    * @returns {boolean} Whether the session is valid
    */
    isValid(sessionId: string): boolean {
        const session = this.get(sessionId);
        return session !== null;
    }

    /**
    * Cleanup expired sessions
    */
    private cleanup(): void {
        const now = new Date();
        for (const [sessionId, session] of this.sessions) {
            if (now > session.expiresAt) {
                const sessionSize = JSON.stringify(session).length;
                this.sessions.delete(sessionId);
                this.currentSize -= sessionSize;
            }
        }
    }
}