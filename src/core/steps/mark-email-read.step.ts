import { BaseStep, StepResult, StepContext } from './step.interface';
import { GmailService } from '../../services/gmail.service';

interface MarkEmailReadConfig {
    userId: string;
    emailIds?: string[];
}

export class MarkEmailReadStep extends BaseStep {
    private gmailService: GmailService;

    constructor(config: MarkEmailReadConfig) {
        super('MarkEmailReadStep', config);
        this.gmailService = new GmailService();
    }

    async execute(input: any, context: StepContext): Promise<StepResult> {
        try {
            const config = this.config as MarkEmailReadConfig;

            // Get email IDs from config or from previous step output
            let emailIds = config.emailIds || input?.jobEmailIds || input?.emailIds || [];

            if (!Array.isArray(emailIds)) {
                emailIds = [emailIds];
            }

            if (emailIds.length === 0) {
                return this.success({ markedCount: 0, message: 'No emails to mark' });
            }

            await this.gmailService.markAsRead(config.userId, emailIds);

            return this.success({
                markedCount: emailIds.length,
                emailIds,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.failure(`Failed to mark emails as read: ${message}`);
        }
    }

    validate(config: any): boolean {
        return typeof config.userId === 'string' && config.userId.length > 0;
    }
}
