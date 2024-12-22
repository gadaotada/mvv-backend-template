import { CronJob } from 'cron';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LoggingSystem } from '../logging';
import { CronTasks } from './tasks';

/**
* Cron system for handling cron jobs
* @class CronSystem
*/
export class CronSystem {
    /**
    * @private instance - The singleton instance of the CronSystem
    * @private initialized - Whether the system has been initialized
    * @private jobs - The map of cron jobs
    * @private logger - The logging system instance (if active)
    * @private enabled - Whether the system is enabled
    */
    private static instance: CronSystem;
    private initialized = false;
    private jobs: Map<string, CronJob>;
    private logger: LoggingSystem;
    private enabled: boolean = false;

    private constructor() {
        this.jobs = new Map();
        this.logger = LoggingSystem.getInstance();
    }

    /**
     * Get or create the CronSystem instance
     * @param config Optional initial configuration
     */
    public static getInstance(config?: { enabled: boolean }): CronSystem {
        if (!this.instance) {
            this.instance = new CronSystem();
            if (config !== undefined) {
                this.instance.enabled = config.enabled;
            }
        }
        return this.instance;
    }

    /**
    * Initialize the cron system
    * @returns {Promise<void>}
    */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        // Load task files first
        await this.loadTaskFiles();
        
        // Schedule tasks if enabled
        if (this.enabled) {
            this.scheduleLoadedTasks();
        }

        this.initialized = true;
        this.logger.log(`Cron system initialized (${this.enabled ? 'enabled' : 'disabled'})`, 'info');
    }

    /**
    * Load the cron tasks from the task files
    * @returns {Promise<void>}
    */
    private async loadTaskFiles(): Promise<void> {
        try {
            const glob = require('glob');
            const taskFiles = await glob.sync('src/**/tasks/*.ts');
            
            for (const file of taskFiles) {
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

    /**
    * Schedule the loaded tasks
    * @returns {void}
    */
    private scheduleLoadedTasks(): void {
        // Get all registered tasks from CronTasks
        const tasks = CronTasks.getAllTasks();
        
        tasks.forEach((taskDef, taskName) => {
            this.addJob(taskName, taskDef.schedule, taskDef.taskFn, taskDef.timezone);
        });

        this.logger.log(`Scheduled ${tasks.size} tasks`, 'info');
    }

    /**
    * Update system configuration at runtime
    * @param config - New configuration with enabled status
    */
    public updateConfig(config: { enabled: boolean }): void {
        if (this.enabled === config.enabled) {
            return;
        }
        
        this.enabled = config.enabled;
        
        if (config.enabled) {
            // System turning on - load and schedule tasks
            this.loadTaskFiles().then(() => {
                this.scheduleLoadedTasks();
                this.logger.log('CRON system enabled and tasks scheduled', 'info');
            });
        } else {
            // System turning off - stop all jobs
            this.stopAll();
            this.jobs.clear();
            this.logger.log('CRON system disabled and all jobs stopped', 'info');
        }
    }

    /**
    * Get current system configuration
    * @returns Current configuration
    */
    public getConfig(): { enabled: boolean } {
        return { enabled: this.enabled };
    }

    /**
    * Add a new cron job
    * @param name - The name of the cron job
    * @param schedule - The schedule of the cron job
    * @param taskFn - The function to execute
    * @param timezone - The timezone of the cron job
    * @returns {void}
    */
    public addJob(name: string, schedule: string, taskFn: CronModule.TaskFunction, timezone: string = 'UTC'): void {
        if (this.jobs.has(name)) {
            this.logger.log(`Job with name ${name} already exists`, 'error');
            return;
        }

        const maxConcurrent = 1;
        let running = 0;
        
        const job = new CronJob(
            schedule,
            async () => {
                if (!this.enabled) {
                    return;
                }

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
            this.enabled,
            timezone
        );

        this.jobs.set(name, job);
        this.logger.log(`Registered new CRON job: ${name}`, 'info');
    }

    /**
    * Remove a cron job
    * @param name - The name of the cron job
    * @returns {boolean} Whether the job was removed
    */
    public removeJob(name: string): boolean {
        const job = this.jobs.get(name);
        if (job) {
            job.stop();
            this.logger.log(`Removed CRON job: ${name}`, 'info');
            return this.jobs.delete(name);
        }
        return false;
    }

    /**
    * Get a cron job
    * @param name - The name of the cron job
    * @returns {CronJob | undefined} The cron job or undefined if not found
    */
    public getJob(name: string): CronJob | undefined {
        return this.jobs.get(name);
    }

    /**
    * List all cron jobs
    * @returns {CronModule.JobInfo[]} The list of cron jobs
    */
    public listJobs(): CronModule.JobInfo[] {
        return Array.from(this.jobs.entries()).map(([name, job]) => ({
            name,
            running: job.running,
            nextDate: new Date(job.nextDate().valueOf()),
            lastDate: job.lastDate(),
        }));
    }

    /**
    * Stop all cron jobs
    * @returns {void}
    */
    public stopAll(): void {
        this.jobs.forEach(job => job.stop());
        this.logger.log('Stopped all CRON jobs', 'info');
    }

    /**
    * Start all cron jobs
    * @returns {void}
    */
    public startAll(): void {
        this.jobs.forEach(job => job.start());
        this.logger.log('Started all CRON jobs', 'info');
    }
}

