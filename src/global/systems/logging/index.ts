import { AppLevelLogger } from "./app-level-logger";
import { DatabaseLevelLogger } from "./database-level-logger";
import { FileLevelLogger } from "./file-level-logger";
import { ExternalLevelLogger } from "./external-level-logger";
import { Connection, PoolConnection } from "mysql2/promise";

/**
* System for handling application-wide logging functionality
* Supports multiple loggers for different purposes: app, database, file, external
* @class LoggingSystem
*/

export class LoggingSystem {
    /**
        * @returns {LoggingSystem} The singleton instance
        * @private appLogger - Logger for application-level messages
        * @private dbLogger - Logger for database-level messages
        * @private fileLogger - Logger for file-level messages
        * @private externalLogger - Logger for external-level messages
    */
    private static instance: LoggingSystem;
    private appLogger?: AppLevelLogger;
    private dbLogger?: DatabaseLevelLogger;
    private fileLogger?: FileLevelLogger;
    private externalLogger?: ExternalLevelLogger;

    constructor(settings: Logging.LoggingConfigSettings) {
        if (LoggingSystem.instance) {
            return LoggingSystem.instance;
        }

        if (settings.enabled) {
            this.updateLoggers(settings);
        }

        LoggingSystem.instance = this;
    }

    /**
    * Get the singleton instance of LoggingSystem
    * @returns {LoggingSystem} The singleton instance
    */
    static getInstance(): LoggingSystem {
        if (!LoggingSystem.instance) {
            throw new Error('LoggingSystem has not been initialized');
        }
        return LoggingSystem.instance;
    }

    /**
    * Update the loggers based on the provided settings
    * @param settings - Partial configuration settings for loggers
    */
    public updateLoggers(settings: Partial<Logging.LoggingConfigSettings>) {
        if (!settings.enabled) {
            this.disableAllLoggers();
            return;
        }

        const loggerConfigs = {
            appLevel: settings.appLevel,
            databaseLevel: settings.databaseLevel,
            fileLevel: settings.fileLevel,
            externalLevel: settings.externalLevel
        };

        Object.entries(loggerConfigs).forEach(([key, config]) => {
            if (!config?.enabled) {
                this.disableLogger(key as keyof typeof loggerConfigs);
                return;
            }

            switch (key) {
                case "appLevel":
                    this.appLogger = new AppLevelLogger();
                    break;
                case "databaseLevel":
                    if ('table' in config) {
                        this.dbLogger = new DatabaseLevelLogger(config.table);
                    }
                    break;
                case "fileLevel":
                    if ('dir' in config && 'prefix' in config) {
                        this.fileLogger = new FileLevelLogger(
                            config.dir, 
                            config.prefix,
                            config.maxFileSize,
                            config.maxFiles
                        );
                    }
                    break;
                case "externalLevel":
                    if ('endPoint' in config) {
                        this.externalLogger = new ExternalLevelLogger(config.endPoint);
                    }
                    break;
            }
        });
    }

    /**
    * Disable a specific logger
    * @param type - The type of logger to disable
    */
    private disableLogger(type: keyof Logging.LoggingConfigSettings) {
        switch (type) {
            case 'appLevel':
                this.appLogger = undefined;
                break;
            case 'databaseLevel':
                this.dbLogger = undefined;
                break;
            case 'fileLevel':
                if (this.fileLogger) {
                    this.fileLogger.destroy(); // Clean up file streams
                    this.fileLogger = undefined;
                }
                break;
            case 'externalLevel':
                this.externalLogger = undefined;
                break;
        }
    }

    /**
    * Disable all loggers
    */
    private disableAllLoggers() {
        this.appLogger = undefined;
        this.dbLogger = undefined;
        if (this.fileLogger) {
            this.fileLogger.destroy();
            this.fileLogger = undefined;
        }
        this.externalLogger = undefined;
    }

    /**
    * Log a message to the appropriate logger
    * @param data - The data to log
    * @param type - The type of log (info, error, warning, debug)
    * @param connection - Optional connection object for database logger
    */
    log<T = unknown>(data: T, type: Logging.LogType = 'info', connection?: PoolConnection | Connection): void {
        this.appLogger?.log(data, type);
        this.fileLogger?.log(data);
        
        // Database and external loggers can optionally use async but fire-and-forget for now :)
        if (this.dbLogger && connection) {
            this.dbLogger.log(data, connection).catch(() => {});
        }
        if (this.externalLogger) {
            this.externalLogger.log(data).catch(() => {});
        }
    }
}
