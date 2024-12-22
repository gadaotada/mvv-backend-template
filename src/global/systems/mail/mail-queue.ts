import { EventEmitter } from 'events';

/**
* Mail queue for handling email sending
* @class MailQueue
* @extends {EventEmitter}
*/
export class MailQueue extends EventEmitter {
    /**
    * @private queue - The map of queued emails
    * @private processing - Whether the queue is currently processing
    * @private activeJobs - The number of active jobs in the queue
    */
    private queue: Map<string, MailModule.QueuedMail> = new Map();
    private processing: boolean = false;
    private activeJobs: number = 0;

    constructor(private config: MailModule.MailConfig['queueSettings']) {
        super();
    }

    /**
    * Add an email to the queue
    * @param mail - The email to add
    * @returns {Promise<string>} The ID of the queued email
    */
    async add(mail: MailModule.MailOptions): Promise<string> {
        const id = crypto.randomUUID();
        
        this.queue.set(id, {
            ...mail,
            id,
            status: 'pending',
            retries: 0,
            createdAt: new Date()
        });

        this.emit('mail:added', id);
        this.processQueue();
        
        return id;
    }

    /**
    * Add multiple emails to the queue
    * @param mails - The emails to add
    * @returns {Promise<string[]>} The IDs of the queued emails
    */
    async addBulk(mails: MailModule.MailOptions[]): Promise<string[]> {
        const ids = mails.map(mail => {
            const id = crypto.randomUUID();
            this.queue.set(id, {
                ...mail,
                id,
                status: 'pending',
                retries: 0,
                createdAt: new Date()
            });
            return id;
        });

        this.emit('mail:bulkAdded', ids);
        this.processQueue();

        return ids;
    }

    /**
    * Process the queue of emails
    */
    private async processQueue() {
        if (this.processing) {
            return;
        }

        this.processing = true;

        while (this.queue.size > 0 && this.activeJobs < this.config.maxConcurrent) {
            const pendingMail = Array.from(this.queue.values())
                .find(mail => mail.status === 'pending');

            if (!pendingMail) {
                break;
            }

            this.activeJobs++;
            pendingMail.status = 'processing';
            this.emit('mail:processing', pendingMail.id);

            try {
                this.emit('mail:process', pendingMail);
                pendingMail.status = 'completed';
                this.queue.delete(pendingMail.id);
                this.emit('mail:completed', pendingMail.id);
            } catch (error) {
                if (pendingMail.retries < this.config.maxRetries) {
                    pendingMail.retries++;
                    pendingMail.status = 'pending';
                    pendingMail.error = error instanceof Error ? error.message : String(error);
                    this.emit('mail:retry', pendingMail.id);
                    await new Promise(resolve => 
                        setTimeout(resolve, this.config.retryDelay)
                    );
                } else {
                    pendingMail.status = 'failed';
                    this.emit('mail:failed', pendingMail.id, error);
                    this.queue.delete(pendingMail.id);
                }
            } finally {
                this.activeJobs--;
            }
        }

        this.processing = false;
        if (this.queue.size === 0) {
            this.emit('queue:empty');
        }
    }

    /**
    * Get the status of a queued email
    * @param id - The ID of the queued email
    * @returns {MailModule.QueuedMail | undefined} The status of the queued email or undefined if not found
    */
    getStatus(id: string): MailModule.QueuedMail | undefined {
        return this.queue.get(id);
    }

    /**
    * Clear the queue of emails
    */
    clear(): void {
        this.queue.clear();
        this.emit('queue:cleared');
    }
} 