import settings from './settings.json';
import { TestEmail } from './global/systems/mail/templates';
import { MailSystem } from './global/systems/mail';
import { LoggingSystem } from './global/systems/logging';
import { CronSystem } from './global/systems/crons';
import { CronJob } from './global/systems/crons/decorators';
import { ConfigManager } from './global/config';
import { JWTSessionManager } from './global/systems/auth/jwt-manager';

export const config = ConfigManager.getInstance('./src/settings.yml');
export const cronSys = CronSystem.getInstance(config.get('crons'));

export const mailSys = new MailSystem(config.get('mail'));
export const loggerSys = new LoggingSystem(config.get('logging'));
export const authSys = new JWTSessionManager(config.get('auth'));

cronSys.initialize();

async function TestSignleMail() {
    const mailProps = {
        to: 'n.kosev@2goodprojects.eu',
        subject: 'Test Email',
        from: settings.mail.defaultFrom,
        Template: TestEmail,
        templateProps: { name: 'Niki' },
    }
    await mailSys.sendMail(mailProps);
}

const bulkOptions = [
    {
        to: 'n.kosev@2goodprojects.eu',
        subject: 'Test Email',
        from: settings.mail.defaultFrom,
    },
    {
        to: 'n.kosev@2goodprojects.eu',
        subject: 'Test Email 2',
        from: settings.mail.defaultFrom,
    },
    {
        to: 'n.kosev@2goodprojects.eu',
        subject: 'Test Email 3',
        from: settings.mail.defaultFrom,
    },
    {
        to: 'n.kosev@2goodprojects.eu',
        subject: 'Test Email 4',
        from: settings.mail.defaultFrom,
    },
    {
        to: 'n.kosev@2goodprojects.eu',
        subject: 'Test Email 5',
        from: settings.mail.defaultFrom,
    },
    {
        to: 'n.kosev@2goodprojects.eu',
        subject: 'Test Email 6',
        from: settings.mail.defaultFrom,
    },
    {
        to: 'n.kosev@2goodprojects.eu',
        subject: 'Test Email 7',
        from: settings.mail.defaultFrom,
    },
    {
        to: 'n.kosev@2goodprojects.eu',
        subject: 'Test Email 8',
        from: settings.mail.defaultFrom,
    },
    {
        to: 'n.kosev@2goodprojects.eu',
        subject: 'Test Email 9',
        from: settings.mail.defaultFrom,
    },
    {
        to: 'n.kosev@2goodprojects.eu',
        subject: 'Test Email 10',
        from: settings.mail.defaultFrom,
    },
]


/* async function TestBulkMail() {
    await mail.sendBulk(bulkOptions);
} */

TestSignleMail();

async function authExample() {
    try {
        // Create a new user session
        const userId = 123;
        const session = await authSys.createSession(userId, ['user']);
        
        // Check permissions
        const canEditPost = await authSys.hasPermission(
            session,
            'posts:edit:own',
            userId
        );
        
        loggerSys.log({
            message: 'Auth check completed',
            canEdit: canEditPost
        }, 'info');
    } catch (error) {
        loggerSys.log({
            message: 'Auth example failed',
            error
        }, 'error');
    }
}

async function mailExample() {
    try {
        // Single email with template
        await mailSys.sendMail({
            to: 'user@example.com',
            subject: 'Welcome to Our Platform',
            Template: TestEmail,
            templateProps: { 
                name: 'John Doe',
                activationLink: 'https://example.com/activate'
            }
        });

        // Bulk emails
        const users = [
            { email: 'user1@example.com', name: 'User 1' },
            { email: 'user2@example.com', name: 'User 2' }
        ];

        await mailSys.sendBulk(users.map(user => ({
            to: user.email,
            subject: 'Platform Update',
            Template: TestEmail,
            templateProps: { name: user.name }
        })));

    } catch (error) {
        loggerSys.log({
            message: 'Mail example failed',
            error
        }, 'error');
    }
}

// Example cron task using decorator
class ExampleTasks {
    @CronJob('example.dailyTask', '0 0 * * *', 'UTC')
    static async dailyTask(): Promise<void> {
        loggerSys.log('Running daily task', 'info');
        await mailSys.sendMail({
            to: 'admin@example.com',
            subject: 'Daily Report',
            html: '<h1>Daily Report</h1><p>System is running smoothly!</p>'
        });
    }
}

// Run examples
authExample();
mailExample();


