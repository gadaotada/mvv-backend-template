import { CronTasks } from './tasks';

export function CronJob(name: string, schedule: string, timezone?: string) {
    return function (
        _target: object,
        context: ClassMethodDecoratorContext
    ) {
        const methodFn = context.static ? 
            (_target as any)[context.name] : 
            (_target as any).prototype[context.name];
            
        CronTasks.register(name, methodFn, schedule, timezone);
    };
} 