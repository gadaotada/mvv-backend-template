/**
* Logger for application-level messages
* @class AppLevelLogger
*/
export class AppLevelLogger {
    /**
    * Log a message to the console
    * @param data - The data to log
    * @param type - The type of log (error, warning, info)
    */
    log<T = unknown>(data: T, type: Logging.LogType): void {
        const prefix = `[AppLevel]:`;
        const logData = JSON.stringify(data, null, 2);

        switch (type) {
            case "error":
                console.error(`${prefix}`, logData);
                break;
            case "warning":
                console.warn(`${prefix}`, logData);
                break;
            default:
                console.log(`${prefix}`, logData);
        }
    }
}
