import { Connection, PoolConnection, QueryOptions } from "mysql2/promise";
import { LoggingSystem } from "../logging/main";

declare global {
    namespace DTO {
        interface DTOOptions<T extends QueryResult = RowDataPacket[]> {
            connection: PoolConnection | Connection;
            query: string | QueryOptions;
            values?: any[];
            loggingSystem?: LoggingSystem;
        }
        
        type QueryExecutionResult<T> = {
            success: boolean;
            data?: T;
            error?: string;
            metadata?: {
                affectedRows?: number;
                insertId?: number;
            };
        }
    }
}