/**
* Logger for application-level messages
* @class AppLogger
*/
export class AppLogger {
    /**
    * Log a message to the console
    * @param data - The data to log
    * @param type - The type of log (error, warning, info)
    */
    log<T = unknown>(data: T, type: Logging.LogLevel): void {
        const prefix = `[AppLevel]:`;
        const logData = JSON.stringify(data, null, 2);

        switch (type) {
            case "error":
                console.error(`${prefix}`, logData);
                break;
            case "warn":
                console.warn(`${prefix}`, logData);
                break;
            case "info":
                console.info(`${prefix}`, logData);
                break;
            case "debug":
                console.debug(`${prefix}`, logData);
                break;
            default:
                console.log(`${prefix}`, logData);
        }
    }
}