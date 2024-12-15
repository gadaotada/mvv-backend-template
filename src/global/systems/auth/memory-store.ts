export class MemorySessionStore implements AuthModule.SessionStore {
    private sessions: Map<string, AuthModule.SessionData> = new Map();
    private currentSize: number = 0;
    private maxSize: number;

    constructor(maxSizeInBytes: number) {
        this.maxSize = maxSizeInBytes;
    }

    async set(sessionId: string, data: AuthModule.SessionData): Promise<void> {
        // Implementation coming soon
    }

    async get(sessionId: string): Promise<AuthModule.SessionData | null> {
        // Implementation coming soon
        return null;
    }

    async delete(sessionId: string): Promise<void> {
        // Implementation coming soon
    }

    async isValid(sessionId: string): Promise<boolean> {
        // Implementation coming soon
        return false;
    }
}