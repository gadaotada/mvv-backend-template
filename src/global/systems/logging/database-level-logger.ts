import { Connection, PoolConnection } from "mysql2/promise";

export class DatabaseLevelLogger {
    private table: string;
    private tableChecked: boolean = false;

    constructor(table: string) {
        this.table = table;
    }

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
