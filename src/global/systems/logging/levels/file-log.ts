import { createWriteStream, statSync, renameSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

/**
* Logger for file-level messages
* @class FileLogger
*/
export class FileLogger {
    /**
    * @param dir - The directory to log to
    * @param prefix - The prefix for the log file
    * @param maxFileSize - The maximum file size before rotation (default 10MB)
    * @param maxFiles - The maximum number of log files to keep (default 7)
    */
    private dir: string;
    private prefix: string;
    private currentFile: string;
    private maxFileSize: number; // in bytes
    private maxFiles: number;
    private stream?: ReturnType<typeof createWriteStream>;

    constructor(
        dir: string, 
        prefix: string,
        maxFileSize: number = 10 * 1024 * 1024, // Default 10MB
        maxFiles: number = 7 // Keep last 7 files
    ) {
        this.dir = dir;
        this.prefix = prefix;
        this.maxFileSize = maxFileSize;
        this.maxFiles = maxFiles;
        this.currentFile = this.getCurrentFilePath();
    }

    /**
    * Get the current file path
    * @returns {string} The current file path
    */
    private getCurrentFilePath(): string {
        return join(
            this.dir,
            `${this.prefix}-${new Date().toISOString().split("T")[0]}.log`
        );
    }

    /**
    * Get the rotated file path
    * @param index - The index of the rotated file
    * @returns {string} The rotated file path
    */
    private getRotatedFilePath(index: number): string {
        return `${this.currentFile}.${index}`;
    }

    /**
    * Rotate the log files
    */
    private async rotateFiles(): Promise<void> {
        if (this.stream) {
            this.stream.end();
            this.stream = undefined;
        }

        // Rotate existing files
        for (let i = this.maxFiles - 1; i >= 0; i--) {
            const currentFile = i === 0 ? this.currentFile : this.getRotatedFilePath(i);
            const nextFile = this.getRotatedFilePath(i + 1);

            if (existsSync(currentFile)) {
                if (i === this.maxFiles - 1) {
                    // Delete the oldest file
                    try {
                        unlinkSync(currentFile);
                    } catch (error) {
                        console.error(`Failed to delete old log file: ${currentFile}`, error);
                    }
                } else {
                    // Rename current to next
                    try {
                        renameSync(currentFile, nextFile);
                    } catch (error) {
                        console.error(`Failed to rotate log file: ${currentFile}`, error);
                    }
                }
            }
        }
    }

    /**
    * Check if the log file needs to be rotated
    */
    private checkRotation(): void {
        try {
            if (!existsSync(this.currentFile)) {
                return;
            }

            const stats = statSync(this.currentFile);
            if (stats.size >= this.maxFileSize) {
                this.rotateFiles();
            }
        } catch (error) {
            console.error('Error checking file rotation:', error);
        }
    }

    /**
    * Get the write stream for the current log file
    * @returns {ReturnType<typeof createWriteStream>} The write stream
    */
    private getStream(): ReturnType<typeof createWriteStream> {
        if (!this.stream) {
            this.stream = createWriteStream(this.currentFile, { flags: "a" });
            
            // Handle stream errors
            this.stream.on('error', (error) => {
                console.error('Error writing to log file:', error);
                this.stream = undefined;
            });
        }
        return this.stream;
    }

    /**
    * Log a message to the file
    * @param data - The data to log
    */
    log<T = unknown>(data: T): void {
        try {
            this.checkRotation();

            const newFilePath = this.getCurrentFilePath();

            if (newFilePath !== this.currentFile) {
                if (this.stream) {
                    this.stream.end();
                    this.stream = undefined;
                }
                this.currentFile = newFilePath;
            }

            const logEntry = {
                timestamp: new Date().toISOString(),
                data
            };

            this.getStream().write(`${JSON.stringify(logEntry)}\n`);
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }

    /**
    * Destroy the logger
    */
    destroy(): void {
        if (this.stream) {
            this.stream.end();
            this.stream = undefined;
        }
    }
}