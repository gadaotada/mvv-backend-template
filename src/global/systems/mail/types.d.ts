declare global {
    namespace MailModule {
        interface MailConfig {
            smtp: {
                host: string;
                port: number;
                secure: boolean;
                auth: {
                    user: string;
                    pass: string;
                };
            };
            defaultFrom?: string;
            queueSettings: {
                maxRetries: number;
                retryDelay: number; // ms
                maxConcurrent: number;
            };
            attachments?: {
                maxSize: number; // in bytes
            };
        }

        interface MailOptions {
            to: string | string[];
            from?: string;
            subject: string;
            html: string;
            text?: string;
            attachments?: Array<{
                filename: string;
                content: Buffer | string;
                contentType?: string;
            }>;
        }

        interface QueuedMail extends MailOptions {
            id: string;
            status: 'pending' | 'processing' | 'completed' | 'failed';
            retries: number;
            error?: string;
            createdAt: Date;
        }
    }
}
export {}; 