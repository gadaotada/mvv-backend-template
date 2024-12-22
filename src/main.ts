import settings from './settings.json';
import { TestEmail } from './global/systems/mail/templates';
import { MailSystem } from './global/systems/mail';

const mail = MailSystem.getInstance(settings.mail);

async function TestSignleMail() {
    const mailProps = {
        to: 'n.kosev@2goodprojects.eu',
        subject: 'Test Email',
        from: settings.mail.defaultFrom,
        Template: TestEmail,
        templateProps: { name: 'Niki' },
    }
    await mail.sendMail(mailProps);
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

// During app initialization
MailSystem.getInstance(settings.mail);
