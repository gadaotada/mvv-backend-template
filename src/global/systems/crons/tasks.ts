import { LoggingSystem } from '../logging';

/**
* Class for registering and managing cron tasks
* @class CronTasks
*/
export class CronTasks {
    /**
    * @private logger - The logging system instance
    * @private tasks - The map of cron tasks
    */
    private static logger = LoggingSystem.getInstance();
    private static tasks: Map<string, CronModule.TaskDefinition> = new Map();

    /**
    * Register a new cron task
    * @param taskName - The name of the cron task
    * @param taskFn - The function to execute
    * @param schedule - The schedule of the cron task
    * @param timezone - The timezone of the cron task
    * @returns {void}
    */
    static register(
        taskName: string, 
        taskFn: CronModule.TaskFunction, 
        schedule: string,
        timezone?: string
    ): void {
        if (this.tasks.has(taskName)) {
            this.logger.log(`Task ${taskName} already exists, skipping registration`, 'warning');
            return;
        }
        
        this.tasks.set(taskName, { taskFn, schedule, timezone });
        this.logger.log(`Registered CRON task: ${taskName}`, 'info');
    }

    /**
    * Get all registered cron tasks
    * @returns {Map<string, CronModule.TaskDefinition>} The map of cron tasks
    */
    static getAllTasks(): Map<string, CronModule.TaskDefinition> {
        return new Map(this.tasks);
    }

    /**
    * Get a registered cron task
    * @param taskName - The name of the cron task
    * @returns {CronModule.TaskDefinition | undefined} The cron task or undefined if not found
    */
    static getTask(taskName: string): CronModule.TaskDefinition | undefined {
        return this.tasks.get(taskName);
    }

    /**
    * Clear all registered cron tasks
    * @returns {void}
    */
    static clearTasks(): void {
        this.tasks.clear();
    }
}
