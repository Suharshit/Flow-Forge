import { BaseStep, StepResult, StepContext } from './step.interface';
import { JobData } from '../../types/gmail.types';

export class ExtractJobDataStep extends BaseStep {
    constructor(config: any = {}) {
        super('ExtractJobDataStep', config);
    }

    async execute(input: any, context: StepContext): Promise<StepResult> {
        try {
            const jobEmails = input?.jobEmails || [];

            if (!Array.isArray(jobEmails)) {
                return this.failure('Input must contain a jobEmails array');
            }

            const extractedData: JobData[] = jobEmails.map((email: any) =>
                this.extractFromEmail(email)
            );

            return this.success({
                jobData: extractedData,
                companies: extractedData.map(d => d.company).filter(Boolean),
                positions: extractedData.map(d => d.position).filter(Boolean),
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.failure(`Failed to extract job data: ${message}`);
        }
    }

    private extractFromEmail(email: any): JobData {
        const subject = email.subject || '';
        const body = email.body || '';
        const from = email.from || '';
        const text = `${subject} ${body}`;

        return {
            company: this.extractCompany(from, text),
            position: this.extractPosition(subject, text),
            interviewDate: this.extractDate(text),
            interviewType: this.extractInterviewType(text),
            recruiterName: this.extractRecruiterName(from),
            emailId: email.id,
        };
    }

    private extractCompany(from: string, text: string): string | undefined {
        // Extract from email domain
        const domainMatch = from.match(/@([a-zA-Z0-9-]+)\./);
        if (domainMatch) {
            const domain = domainMatch[1];
            return domain.charAt(0).toUpperCase() + domain.slice(1);
        }

        // Look for "at [Company]" pattern
        const atMatch = text.match(/\bat\s+([A-Z][a-zA-Z\s&]+?)(?:\s|,|\.|$)/);
        if (atMatch) {
            return atMatch[1].trim();
        }

        return undefined;
    }

    private extractPosition(subject: string, text: string): string | undefined {
        const patterns = [
            /(?:for the|for a)\s+([A-Z][a-zA-Z\s]+?)\s+(?:position|role|opening)/i,
            /([A-Z][a-zA-Z\s]+?)\s+(?:position|role|opening)/i,
            /applying for\s+([A-Z][a-zA-Z\s]+)/i,
        ];

        for (const pattern of patterns) {
            const match = subject.match(pattern) || text.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        return undefined;
    }

    private extractDate(text: string): string | undefined {
        const datePatterns = [
            /(?:on|scheduled for)\s+([A-Z][a-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i,
            /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
            /(\d{4}-\d{2}-\d{2})/,
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return undefined;
    }

    private extractInterviewType(text: string): 'phone' | 'video' | 'onsite' | 'unknown' {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('phone') || lowerText.includes('call')) {
            return 'phone';
        }
        if (lowerText.includes('zoom') || lowerText.includes('video') || lowerText.includes('teams')) {
            return 'video';
        }
        if (lowerText.includes('onsite') || lowerText.includes('in person') || lowerText.includes('office')) {
            return 'onsite';
        }

        return 'unknown';
    }

    private extractRecruiterName(from: string): string | undefined {
        const nameMatch = from.match(/^([^<]+)/);
        if (nameMatch) {
            return nameMatch[1].trim();
        }
        return undefined;
    }
}
