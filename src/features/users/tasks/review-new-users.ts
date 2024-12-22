import { LoggingSystem } from '../../../global/systems/logging';
import { MailSystem } from '../../../global/systems/mail';
import { CronJob } from '../../../global/systems/crons/decorators';
import { User } from '../types';

export class UserTasks {
    @CronJob('users.dailyReview', '0 0 * * *', 'UTC')
    static async reviewNewUsers(newUsers: User[]): Promise<void> {
        const logger = LoggingSystem.getInstance();
        const mailer = MailSystem.getInstance();

        try {
            if (newUsers.length === 0) {
                logger.log('No new users to review', 'info');
                return;
            }

            // Prepare report data
            const reportData = {
                totalNewUsers: newUsers.length,
                usersList: newUsers.map(user => ({
                    id: user.id,
                    email: user.email,
                }))
            };

            // Send email report
            await mailer.sendMail({
                to: 'admin@yourdomain.com',
                subject: `Daily New Users Review - ${reportData.totalNewUsers} new users`,
                html: `<p>Total new users: ${reportData.totalNewUsers}</p>`
            });

            logger.log({
                message: 'Daily users review completed',
                data: {
                    totalUsers: reportData.totalNewUsers
                }
            }, 'info');

        } catch (error) {
            logger.log({
                message: 'Failed to complete daily users review',
                error
            }, 'error');
            throw error;
        }
    }
} 