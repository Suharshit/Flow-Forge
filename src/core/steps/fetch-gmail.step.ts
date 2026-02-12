import { BaseStep, StepResult, StepContext } from './step.interface';
import { GmailService } from '../../services/gmail.service';

interface FetchGmailConfig {
    userId: string;
    query?: string;
    maxResults?: number;
}

export class FetchGmailStep extends BaseStep {
    private gmailService: GmailService;

    constructor(config: FetchGmailConfig) {
        super('FetchGmailStep', config);
        this.gmailService = new GmailService();
    }

    async execute(input: any, context: StepContext): Promise<StepResult> {
        try {
            const config = this.config as FetchGmailConfig;
            const query = config.query || 'is:unread';
            const maxResults = config.maxResults || 50;

            const emails = await this.gmailService.fetchEmails(
                config.userId,
                query,
                maxResults
            );

            return this.success({
                emails,
                emailCount: emails.length,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.failure(`Failed to fetch Gmail emails: ${message}`);
        }
    }

    validate(config: any): boolean {
        return typeof config.userId === 'string' && config.userId.length > 0;
    }
}
