import { LoggingSystem } from '../logging';
import { CronSystem } from './index';

export class CronTasks {
    private static logger = LoggingSystem.getInstance();
    private static tasks: Map<string, CronModule.TaskDefinition> = new Map();

    /**
     * Register a new task
     * @param taskName Unique identifier for the task
     * @param taskFn The async function to execute
     * @param schedule The cron schedule for the task
     * @param timezone The timezone for the task
     */
    static register(
        taskName: string, 
        taskFn: CronModule.TaskFunction, 
        schedule: string,
        timezone?: string
    ): void {
        if (this.tasks.has(taskName)) {
            this.logger.log(`Task ${taskName} already exists, skipping registration`, 'error');
            return;
        }
        
        this.tasks.set(taskName, { taskFn, schedule, timezone });
        
        // Automatically add to CronSystem
        const cronSystem = CronSystem.getInstance();
        cronSystem.addJob(taskName, schedule, taskFn, timezone);
        
        this.logger.log(`Registered CRON task: ${taskName}`, 'info');
    }

    /**
     * Get a task by its name
     */
    static getTask(taskName: string): CronModule.TaskDefinition {
        const task = this.tasks.get(taskName);
        if (!task) {
            this.logger.log(`Task ${taskName} not found`, 'error');
            // return void
            return { taskFn: async () => {}, schedule: '', timezone: 'UTC' };
        }
        return task;
    }

    /**
     * Register multiple tasks at once
     */
    static registerBulk(tasks: Array<{ name: string } & CronModule.TaskDefinition>): void {
        tasks.forEach(({ name, taskFn, schedule, timezone }) => {
            this.register(name, taskFn, schedule, timezone);
        });
    }

}
