import axios from "axios";

/**
* Logger for external-level messages
* @class ExternalLogger
*/
export class ExternalLogger {
    /**
    * @param endPoint - The endpoint to log to
    */
    constructor(private endPoint: string) {}

    /**
    * Log a message to the external endpoint
    * @param data - The data to log
    */
    async log<T = unknown>(data: T): Promise<void> {
        try {
            await axios.post(this.endPoint, data);
        } catch (error) {
            console.error(`Failed to log to external endpoint:`, error);
        }
    }
}