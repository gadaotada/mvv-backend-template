# TypeScript Systems Framework
A modular TypeScript framework with built-in authentication, logging, email, and cron systems.
## Features
- 🔐 **Authentication System**
 - JWT-based authentication
 - Role-based access control (RBAC)
 - Multiple storage strategies (Memory/Database)
 - Session management
- 📝 **Logging System**
 - Multi-level logging (App/Database/File/External)
 - Configurable log rotation
 - Structured logging format
 - Multiple transport support
- 📧 **Mail System**
 - React-based email templates or plain html
 - Queue system with retry mechanism
 - Bulk sending support
 - Attachment handling
- ⏰ **Cron System**
 - Decorator-based task registration
 - Timezone support
 - Concurrent job handling
 - Runtime configuration
## Installation
```bash
npm install
```
## Configuration
 - Check the settings.yaml(settings.json(old)).

## Usage Examples

### Initialize Systems
```typescript
import { ConfigManager } from './global/config';
import { AuthSystem } from './global/systems/auth';
import { MailSystem } from './global/systems/mail';
import { LoggingSystem } from './global/systems/logging';
import { CronSystem } from './global/systems/crons';

// Initialize config
export const config = ConfigManager.getInstance('./src/settings.yml');

// Initialize systems
export const cronSys = CronSystem.getInstance(config.get('crons'));
export const mailSys = new MailSystem(config.get('mail'));
export const loggerSys = new LoggingSystem(config.get('logging'));
export const authSys = new JWTSessionManager(config.get('auth'));

cronSys.initialize();
```

### Authentication Example

```typescript
// Create a new session
const session = await auth.createSession(userId, ['user']);

// Check permissions
const canEdit = await auth.hasPermission(session, 'posts:edit');

// Validate session
const isValid = await auth.validateSession(session);
```

### Email Example

```typescript
// Send a template email
await mail.sendMail({
    to: 'user@example.com',
    subject: 'Welcome!',
    Template: WelcomeEmail,
    templateProps: { name: 'John' }
});

// Send bulk emails
await mail.sendBulk([
    {
        to: 'user1@example.com',
        subject: 'Update',
        Template: UpdateEmail,
        templateProps: { name: 'User 1' }
    },
    // ... more emails
]);
```

### Logging Example

```typescript
// Different log levels
logger.log('Operation successful', 'info');
logger.log('Warning condition', 'warning');
logger.log({
    message: 'Operation failed',
    error: new Error('Details')
}, 'error');
```

### Cron Job Example

```typescript

class ExampleTasks {
    @CronJob('example.dailyTask', '0 0 * * *', 'UTC')
    static async dailyTask(): Promise<void> {
        await mailSys.sendMail({
            to: 'admin@example.com',
            subject: 'Daily Report',
            html: '<h1>Daily Report</h1><p>System is running smoothly!</p>'
        });
    }
}

// Manual registration
cron.addJob(
    'dailyBackup',
    '0 0 * * *',
    async () => {
        // Backup logic
    }
);
```