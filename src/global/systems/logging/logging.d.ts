import type { Connection, PoolConnection } from "mysql2/promise";

declare global {
    namespace Logging {
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
                maxFileSize: number;
                maxFiles: number;
            };
            externalLevel?: {
                enabled: boolean;
                endPoint: string;
            };
        }

        interface ILogger {
            log<T = unknown>(data: T, level: LogLevel, connection?: PoolConnection | Connection): Promise<void>;
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