import { createWriteStream } from "fs";
import { join } from "path";

export class FileLevelLogger {
    private dir: string;
    private prefix: string;

    constructor(dir: string, prefix: string) {
        this.dir = dir;
        this.prefix = prefix;
    }

    log(message: unknown): void {
        const filePath = join(
            this.dir,
            `${this.prefix}-${new Date().toISOString().split("T")[0]}.log`
        );

        const stream = createWriteStream(filePath, { flags: "a" });
        stream.write(`[${new Date().toISOString()}] ${message}\n`);
        stream.end();
    }
}
