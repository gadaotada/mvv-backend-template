import { AppLevelLogger } from "./app-level-logger";
import { DatabaseLevelLogger } from "./database-level-logger";
import { FileLevelLogger } from "./file-level-logger";
import { ExternalLevelLogger } from "./external-level-logger";
import { Connection, PoolConnection } from "mysql2/promise";

export class LoggingSystem {
    private appLogger?: AppLevelLogger;
    private dbLogger?: DatabaseLevelLogger;
    private fileLogger?: FileLevelLogger;
    private externalLogger?: ExternalLevelLogger;

    constructor(settings: Logging.LoggingConfigSettings) {
        if (settings.enabled) {
            // always check settings.json for enabled loggers!!!
            Object.entries(settings).forEach(([key, value]) => {
                if (!value?.enabled) {
                    return;
                }

                switch (key) {
                    case "appLevel":
                        this.appLogger = new AppLevelLogger();
                        break;
                    case "databaseLevel":
                        this.dbLogger = new DatabaseLevelLogger(value.table);
                        break;
                    case "fileLevel":
                        this.fileLogger = new FileLevelLogger(value.dir, value.prefix);
                        break;
                    case "externalLevel":
                        this.externalLogger = new ExternalLevelLogger(value.endPoint);
                        break;
                }
            });
        }
    }

    log(message: string, type: Logging.LogType, connection?: PoolConnection | Connection): void {
        this.appLogger?.log(message, type);
        this.fileLogger?.log(message);
        
        // Database and external loggers can optionally use async but fire-and-forget for now :)
        if (this.dbLogger && connection) {
            this.dbLogger.log(message, connection).catch(() => {});
        }
        if (this.externalLogger) {
            this.externalLogger.log(message).catch(() => {});
        }
    }
}
