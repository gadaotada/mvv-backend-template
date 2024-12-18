export class AppLevelLogger {
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
