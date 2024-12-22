import { Connection, PoolConnection } from "mysql2/promise";

/**
* Logger for database-level messages
* @class DatabaseLevelLogger
*/
export class DatabaseLevelLogger {
    /**
    * @param table - The name of the table to log to
    * @private tableChecked - Whether the table has been checked for existence
    */
    private table: string;
    private tableChecked: boolean = false;

    constructor(table: string) {
        this.table = table;
    }

    /**
    * Ensure the table exists
    * @param connection - The database connection
    */
    async ensureTableExists(connection: PoolConnection | Connection): Promise<void> {
        if (this.tableChecked) {
            return;
        }
        try {
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS ${this.table} (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    data JSON NOT NULL,
                    timestamp DATETIME NOT NULL,
                    PRIMARY KEY (id)
                )
            `);
            this.tableChecked = true;
        } catch (error) {
            console.error(`Failed to ensure table exists:`, error);
            throw error;
        }
    }

    /**
    * Log a message to the database
    * @param data - The data to log
    * @param connection - The database connection
    */
    async log<T = unknown>(data: T, connection: PoolConnection | Connection): Promise<void> {
        try {
            await this.ensureTableExists(connection);
            const query = `INSERT INTO ${this.table} (data, timestamp) VALUES (?, NOW())`;
            await connection.execute(query, [JSON.stringify(data)]);
        } catch (error) {
            console.error(`Failed to log data:`, error);
        }
    }
}
