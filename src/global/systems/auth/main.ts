import { DatabaseSessionStore } from "./database-store";
import { MemorySessionStore } from "./memory-store";

export class AuthSystem {
    private sessionStore: AuthModule.SessionStore;
    private config: AuthModule.AuthConfig;

    constructor(config: AuthModule.AuthConfig) {
        this.config = config;
        this.sessionStore = this.initializeSessionStore();
    }

    private initializeSessionStore(): AuthModule.SessionStore {
        const { memory, database } = this.config.sessionStorage.strategies;

        if (memory.enabled) {
            return new MemorySessionStore(memory.maxSizeInBytes);
        }

        if (database.enabled) {
            return new DatabaseSessionStore(
                database.useDbCache,
                database.cacheDuration,
                database.cacheSizeInBytes
            );
        }

        throw new Error("No session storage strategy enabled");
    }

    // Auth methods coming soon...
}