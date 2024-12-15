import axios from "axios";

export class ExternalLevelLogger {
    private endPoint: string;

    constructor(endPoint: string) {
        this.endPoint = endPoint;
    }

    async log(message: string): Promise<void> {
        try {
            await axios.post(this.endPoint, { message, timestamp: new Date() });
        } catch (error) {
            console.error(`Failed to log message to external endpoint: ${error}`);
        }
    }
}
