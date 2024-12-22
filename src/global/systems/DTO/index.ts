import { QueryResult, RowDataPacket } from "mysql2/promise";
import { LoggingSystem } from '../logging';

/**
* Data Transfer Object (DTO) class for database operations
* @class DTO
* @template T - The type of the query result
*/
export class DTO<T extends QueryResult = RowDataPacket[]> {
    /**
    * @param options - The options for the DTO
    */
    private readonly options: Omit<DTO.DTOOptions<T>, 'loggingSystem'>;

    constructor(options: Omit<DTO.DTOOptions<T>, 'loggingSystem'>) {
        this.options = options;
    }

    /**
    * Execute the query
    * @returns {Promise<DTO.QueryExecutionResult<T>>} The result of the query
    */
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
            
            LoggingSystem.getInstance().log(
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