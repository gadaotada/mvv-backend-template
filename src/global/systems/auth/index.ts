import { DatabaseSessionStore } from "./database-store";
import { MemorySessionStore } from "./memory-store";

/**
* Internal system for handling authentication storage strategies
* @class AuthSystem
* @internal
*/
export class AuthSystem {
    /**
    * @private sessionStore - The session store for the authentication system
    * @private config - The configuration for the authentication system
    */
    private sessionStore: AuthModule.SessionStore;
    private config: AuthModule.AuthConfig;
    
    constructor(config: AuthModule.AuthConfig) {
        this.config = config;
        this.sessionStore = this.initializeSessionStore();
    }

    /**
    * Get the session store
    * @returns {AuthModule.SessionStore} The session store
    * @internal
    */
    getSessionStore(): AuthModule.SessionStore {
        return this.sessionStore;
    }

    /**
    * Initialize the session store
    * @returns {AuthModule.SessionStore} The session store
    * @private
    */
    private initializeSessionStore(): AuthModule.SessionStore {
        const { memory, database } = this.config.sessionStorage.strategies;

        if (memory.enabled) {
            return new MemorySessionStore(memory.maxSessionSize);
        }

        if (database.enabled) {
            return new DatabaseSessionStore(
                database.useDbCache,
                database.cacheDuration,
                database.cacheSizeMax
            );
        }

        throw new Error("No session storage strategy enabled");
    }
}