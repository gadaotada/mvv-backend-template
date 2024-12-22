import { CronJob } from 'cron';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LoggingSystem } from '../logging';
import { CronTasks } from './tasks';

export class CronSystem {
    private static instance: CronSystem;
    private initialized = false;
    private jobs: Map<string, CronJob>;
    private logger: LoggingSystem;

    public static getInstance(): CronSystem {
        if (!this.instance) {
            this.instance = new CronSystem();
        }
        return this.instance;
    }

    private constructor() {
        this.jobs = new Map();
        this.logger = LoggingSystem.getInstance();
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        // Check if system is enabled
        const enabled = this.loadSettings();
        if (!enabled) {
            this.logger.log('Cron system is disabled in settings', 'info');
            return;
        }

        // Load all task files
        await this.loadTaskFiles();
        this.initialized = true;
        this.logger.log('Cron system initialized', 'info');
    }

    private loadSettings(): boolean {
        try {
            const settingsPath = join(process.cwd(), 'settings.json');
            const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
            return settings.crons?.enabled ?? false;
        } catch (error) {
            this.logger.log({
                message: 'Failed to load CRON settings, defaulting to disabled',
                error
            }, 'error');
            return false;
        }
    }

    private async loadTaskFiles(): Promise<void> {
        try {
            // You'll need to install @types/glob and glob
            const glob = require('glob');
            const taskFiles = await glob.sync('src/**/tasks/*.ts');
            
            for (const file of taskFiles) {
                // Dynamic import of each task file
                await import(file);
            }
            
            this.logger.log(`Loaded ${taskFiles.length} task files`, 'info');
        } catch (error) {
            this.logger.log({
                message: 'Failed to load task files',
                error
            }, 'error');
        }
    }

    public addJob(name: string, schedule: string, taskFn: CronModule.TaskFunction, timezone: string = 'UTC'): void {
        if (this.jobs.has(name)) {
            this.logger.log(`Job with name ${name} already exists`, 'error');
            return;
        }

        const maxConcurrent = 1; // Configure per job
        let running = 0;
        
        const job = new CronJob(
            schedule,
            async () => {
                if (running >= maxConcurrent) {
                    this.logger.log(`Skipping ${name}: max concurrent runs reached`, "warning");
                    return;
                }
                running++;
                try {
                    await taskFn();
                } finally {
                    running--;
                }
            },
            null,
            true,
            timezone
        );

        this.jobs.set(name, job);
        this.logger.log(`Registered new CRON job: ${name}`, 'info');
    }

    public removeJob(name: string): boolean {
        const job = this.jobs.get(name);
        if (job) {
            job.stop();
            this.logger.log(`Removed CRON job: ${name}`, 'info');
            return this.jobs.delete(name);
        }
        return false;
    }

    public getJob(name: string): CronJob | undefined {
        return this.jobs.get(name);
    }

    public listJobs(): CronModule.JobInfo[] {
        return Array.from(this.jobs.entries()).map(([name, job]) => ({
            name,
            running: job.running,
            nextDate: new Date(job.nextDate().valueOf()),
            lastDate: job.lastDate(),
        }));
    }

    public stopAll(): void {
        this.jobs.forEach(job => job.stop());
        this.logger.log('Stopped all CRON jobs', 'info');
    }

    public startAll(): void {
        this.jobs.forEach(job => job.start());
        this.logger.log('Started all CRON jobs', 'info');
    }
}

