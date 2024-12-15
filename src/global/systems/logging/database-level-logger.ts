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

            const [rows] = await connection.execute(
                `SELECT 1 FROM information_schema.tables 
                 WHERE table_schema = DATABASE() 
                 AND table_name = ?`,
                [this.table]
            );


            if (Array.isArray(rows) && rows.length === 0) {
                await connection.execute(`
                    CREATE TABLE ${this.table} (
                        id BIGINT NOT NULL AUTO_INCREMENT,
                        message TEXT NOT NULL,
                        timestamp DATETIME NOT NULL,
                        PRIMARY KEY (id)
                    )
                `);
            }

            this.tableChecked = true;

        } catch (error) {
            console.error(`Failed to ensure table exists: ${error}`);
            throw error;
        }
    }

    async log(message: string, connection: PoolConnection | Connection): Promise<void> {
        try {
            await this.ensureTableExists(connection);
            const query = `INSERT INTO ${this.table} (message, timestamp) VALUES (?, NOW())`;
            await connection.execute(query, [message]);
        } catch (error) {
            console.error(`Failed to log message: ${error}`);
        }
    }
}
