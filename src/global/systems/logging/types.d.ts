import type { Connection, PoolConnection } from "mysql2/promise";

declare global {
    namespace Logging {
        type LogType = 'info' | 'warning' | 'error' | 'debug';
        type LogLevel = 'info' | 'warn' | 'error' | 'debug';

        interface LoggingConfigSettings {
            enabled: boolean;
            appLevel?: {
                enabled: boolean;
            };
            databaseLevel?: {
                enabled: boolean;
                table: string;
            };
            fileLevel?: {
                enabled: boolean;
                dir: string;
                prefix: string;
            };
            externalLevel?: {
                enabled: boolean;
                endPoint: string;
            };
        }

        interface ILogger {
            log(message: string, level: LogLevel, connection: PoolConnection | Connection): Promise<void>;
        }

        interface LogEntry {
            id: bigint;
            message: string;
            timestamp: Date;
            level: LogLevel;
            metadata?: Record<string, unknown>;
        }

        interface LoggingConfig {
            settings: LoggingConfigSettings;
            table: string;
            enableConsole?: boolean;
            minLevel?: LogLevel;
            metadata?: Record<string, unknown>;
        }
    }
}
export {};