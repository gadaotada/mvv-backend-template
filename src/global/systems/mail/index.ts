import {createElement} from 'react';
import nodemailer from 'nodemailer';
import { render } from '@react-email/components';
import { MailQueue } from './mail-queue';
import type { Transporter } from 'nodemailer';

export class MailSystem {
    private static instance: MailSystem;
    private transporter!: Transporter;
    private queue!: MailQueue;
    private config!: MailModule.MailConfig;

    constructor(config: MailModule.MailConfig) {
        if (MailSystem.instance) {
            return MailSystem.instance;
        }

        this.config = config;
        this.transporter = nodemailer.createTransport(config.smtp);
        this.queue = new MailQueue(config.queueSettings);
        
        this.setupQueueListeners();
        MailSystem.instance = this;
    }

    private validateAttachments(attachments?: MailModule.MailOptions['attachments']): void {
        if (!attachments?.length) {
            return;
        }

        const maxSize = this.config.attachments?.maxSize || 10 * 1024 * 1024; // Default 10MB

        for (const attachment of attachments) {
            // Check size
            if (attachment.content instanceof Buffer) {
                if (attachment.content.length > maxSize) {
                    throw new Error(`Attachment ${attachment.filename} exceeds maximum size of ${maxSize} bytes`);
                }
            }

        }
    }

    private setupQueueListeners(): void {
        this.queue.on('mail:process', async (mail: MailModule.QueuedMail) => {
            await this.transporter.sendMail({
                ...mail,
                from: mail.from || this.config.defaultFrom
            });
        });

        this.queue.on('queue:empty', () => {
            this.destroy();
        });
    }

    async sendMail(options: MailModule.MailOptions): Promise<string> {
        this.validateAttachments(options.attachments);
        return this.queue.add(options);
    }

    async sendBulk(options: MailModule.MailOptions[]): Promise<string[]> {
        options.forEach(opt => this.validateAttachments(opt.attachments));
        return this.queue.addBulk(options);
    }

    async sendTemplate(
        Template: React.FC,
        props: any,
        options: Omit<MailModule.MailOptions, 'html'>
    ): Promise<string> {
        const template = createElement(Template, props);
        const html = await render(template);
        return this.sendMail({ ...options, html });
    }

    getMailStatus(id: string): MailModule.QueuedMail | undefined {
        return this.queue.getStatus(id);
    }

    async destroy(): Promise<void> {
        this.queue.clear()
        this.transporter.close();
    }
} 