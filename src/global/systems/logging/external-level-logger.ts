import axios from "axios";

export class ExternalLevelLogger {
    constructor(private endPoint: string) {}

    async log<T = unknown>(data: T): Promise<void> {
        try {
            await axios.post(this.endPoint, data);
        } catch (error) {
            console.error(`Failed to log to external endpoint:`, error);
        }
    }
}
