import { QueryResult, RowDataPacket } from "mysql2/promise";

export class DTO<T extends QueryResult = RowDataPacket[]> {
    private readonly options: DTO.DTOOptions<T>;

    constructor(options: DTO.DTOOptions<T>) {
        this.options = options;
    }

    async execute(): Promise<DTO.QueryExecutionResult<T>> {
        try {
            const [result] = await this.options.connection.execute<T>(
                typeof this.options.query === 'string' ? this.options.query : this.options.query.sql,
                this.options.values
            );

            return {
                success: true,
                data: result,
                metadata: {
                    affectedRows: 'affectedRows' in result ? result.affectedRows : undefined,
                    insertId: 'insertId' in result ? result.insertId : undefined
                }
            };

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            this.options.loggingSystem?.log(
                `Error executing query: ${errorMessage}`,
                'error',
                this.options.connection
            );

            return {
                success: false,
                error: errorMessage
            };
        }
    }
}