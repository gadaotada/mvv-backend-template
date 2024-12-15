export class AppLevelLogger {
    log(message: string, type: Logging.LogType): void {
        const prefix = `[AppLevel]:`;

        switch (type) {
            case "error":
                console.error(`${prefix} ${message}`);
                break;
            case "warning":
                console.warn(`${prefix} ${message}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
                break;
        }
    }
}
