import { BaseStep, StepResult, StepContext } from './step.interface';
import { ClassifiedEmail } from '../../types/gmail.types';

interface ClassifyEmailConfig {
    keywords?: string[];
    senderDomains?: string[];
}

export class ClassifyEmailStep extends BaseStep {
    private defaultKeywords = [
        'interview',
        'application',
        'position',
        'candidate',
        'recruiter',
        'hiring',
        'job offer',
        'screening',
        'phone screen',
        'onsite',
        'technical interview',
        'hr',
        'talent',
    ];

    constructor(config: ClassifyEmailConfig) {
        super('ClassifyEmailStep', config);
    }

    async execute(input: any, context: StepContext): Promise<StepResult> {
        try {
            const config = this.config as ClassifyEmailConfig;
            const keywords = config.keywords || this.defaultKeywords;
            const senderDomains = config.senderDomains || [];

            // Get emails from previous step
            const emails = input?.emails || [];

            if (!Array.isArray(emails)) {
                return this.failure('Input must contain an emails array');
            }

            const classified: ClassifiedEmail[] = emails.map((email: any) => {
                const { isJobRelated, matchedKeywords, confidence } = this.classifyEmail(
                    email,
                    keywords,
                    senderDomains
                );

                return {
                    email,
                    isJobRelated,
                    confidence,
                    matchedKeywords,
                };
            });

            const jobEmails = classified.filter(c => c.isJobRelated);

            return this.success({
                allEmails: classified,
                jobEmails: jobEmails.map(c => c.email),
                jobEmailCount: jobEmails.length,
                jobEmailIds: jobEmails.map(c => c.email.id),
                classifications: classified,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.failure(`Failed to classify emails: ${message}`);
        }
    }

    private classifyEmail(
        email: any,
        keywords: string[],
        senderDomains: string[]
    ): { isJobRelated: boolean; matchedKeywords: string[]; confidence: number } {
        const text = `${email.subject} ${email.body} ${email.from}`.toLowerCase();
        const matchedKeywords: string[] = [];

        // Check keywords
        for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) {
                matchedKeywords.push(keyword);
            }
        }

        // Check sender domains
        let domainMatch = false;
        if (senderDomains.length > 0) {
            for (const domain of senderDomains) {
                if (email.from.toLowerCase().includes(domain.toLowerCase())) {
                    domainMatch = true;
                    break;
                }
            }
        }

        // Calculate confidence
        let confidence = 0;
        if (matchedKeywords.length > 0) {
            confidence += Math.min(matchedKeywords.length * 0.2, 0.6);
        }
        if (domainMatch) {
            confidence += 0.4;
        }

        const isJobRelated = matchedKeywords.length > 0 || domainMatch;

        return { isJobRelated, matchedKeywords, confidence: Math.min(confidence, 1.0) };
    }
}
