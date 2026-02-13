import { BaseStep, StepResult, StepContext } from './step.interface';
import { NotionService } from '../../services/notion.service';
import { NotionPageData } from '../../types/notion.types';

interface AppendToNotionConfig {
    userId: string;
    databaseId: string;
    jobData?: any[];
    checkDuplicates?: boolean;
}

export class AppendToNotionStep extends BaseStep {
    private notionService: NotionService;

    constructor(config: AppendToNotionConfig) {
        super('AppendToNotionStep', config);
        this.notionService = new NotionService();
    }

    async execute(input: any, context: StepContext): Promise<StepResult> {
        try {
            const config = this.config as AppendToNotionConfig;
            const jobData = config.jobData || input?.jobData || [];

            if (!Array.isArray(jobData)) {
                return this.failure('jobData must be an array');
            }

            if (jobData.length === 0) {
                return this.success({ createdCount: 0, skippedCount: 0, message: 'No job data to add' });
            }

            const created: string[] = [];
            const skipped: string[] = [];

            for (const job of jobData) {
                // Check for duplicates if enabled
                if (config.checkDuplicates !== false && job.emailId) {
                    const emailLink = `https://mail.google.com/mail/u/0/#inbox/${job.emailId}`;
                    const existing = await this.notionService.queryDatabase(
                        config.userId,
                        config.databaseId,
                        emailLink
                    );

                    if (existing.length > 0) {
                        console.log(`Skipping duplicate: ${job.company} - ${job.position}`);
                        skipped.push(job.emailId);
                        continue;
                    }
                }

                // Prepare page data
                const pageData: NotionPageData = {
                    company: job.company || 'Unknown Company',
                    position: job.position,
                    status: this.determineStatus(job),
                    interviewDate: job.interviewDate,
                    interviewType: job.interviewType,
                    recruiterName: job.recruiterName,
                    recruiterEmail: job.recruiterEmail,
                    emailLink: job.emailId ? `https://mail.google.com/mail/u/0/#inbox/${job.emailId}` : undefined,
                    priority: 'Medium',
                    notes: job.emailSnippet || job.emailSubject,
                };

                // Create page in Notion
                const pageId = await this.notionService.createPage(config.userId, config.databaseId, pageData);
                created.push(pageId);

                console.log(`Created Notion page: ${job.company} - ${job.position}`);
            }

            return this.success({
                createdCount: created.length,
                skippedCount: skipped.length,
                createdPageIds: created,
                skippedEmailIds: skipped,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.failure(`Failed to append to Notion: ${message}`);
        }
    }

    private determineStatus(job: any): string {
        const subject = (job.emailSubject || '').toLowerCase();

        if (subject.includes('offer') || subject.includes('congratulations')) {
            return 'Offer';
        }
        if (subject.includes('interview scheduled') || subject.includes('interview confirmed')) {
            return 'Interview Scheduled';
        }
        if (subject.includes('next steps') || subject.includes('move forward')) {
            return 'Interviewed';
        }
        if (subject.includes('application received') || subject.includes('thank you for applying')) {
            return 'Applied';
        }

        return 'New';
    }

    validate(config: any): boolean {
        return (
            typeof config.userId === 'string' &&
            typeof config.databaseId === 'string' &&
            config.databaseId.length > 0
        );
    }
}
