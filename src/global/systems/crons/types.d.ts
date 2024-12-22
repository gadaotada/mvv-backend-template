declare global {
    namespace CronModule {
        type TaskFunction = (...args: any[]) => Promise<void>;

        interface TaskDefinition {
            taskFn: TaskFunction;
            schedule: string;
            timezone?: string;
        }

        interface JobInfo {
            name: string;
            running: boolean;
            nextDate: Date;
            lastDate: Date | null;
        }
    }
}

export {};