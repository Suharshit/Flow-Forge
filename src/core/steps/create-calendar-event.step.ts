import { BaseStep, StepResult, StepContext } from './step.interface';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { CalendarEvent } from '../../types/calendar.types';

interface CreateCalendarEventConfig {
    userId: string;
    calendarId?: string;
    jobData?: any[];
}

export class CreateCalendarEventStep extends BaseStep {
    private calendarService: GoogleCalendarService;

    constructor(config: CreateCalendarEventConfig) {
        super('CreateCalendarEventStep', config);
        this.calendarService = new GoogleCalendarService();
    }

    async execute(input: any, context: StepContext): Promise<StepResult> {
        try {
            const config = this.config as CreateCalendarEventConfig;
            const jobData = config.jobData || input?.jobData || [];
            const calendarId = config.calendarId || 'primary';

            if (!Array.isArray(jobData)) {
                return this.failure('jobData must be an array');
            }

            const eventsWithDates = jobData.filter(job => job.interviewDate);

            if (eventsWithDates.length === 0) {
                return this.success({
                    createdCount: 0,
                    message: 'No interviews with dates to add to calendar'
                });
            }

            const created: string[] = [];

            for (const job of eventsWithDates) {
                const event = this.buildCalendarEvent(job);
                const eventId = await this.calendarService.createEvent(
                    config.userId,
                    calendarId,
                    event
                );

                created.push(eventId);
                console.log(`Created calendar event: ${job.company} - ${job.position}`);
            }

            return this.success({
                createdCount: created.length,
                eventIds: created,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.failure(`Failed to create calendar events: ${message}`);
        }
    }

    private buildCalendarEvent(job: any): CalendarEvent {
        const summary = `Interview: ${job.company}${job.position ? ' - ' + job.position : ''}`;

        let description = `Interview for ${job.position || 'position'} at ${job.company}\n\n`;

        if (job.recruiterName) {
            description += `Recruiter: ${job.recruiterName}\n`;
        }
        if (job.recruiterEmail) {
            description += `Email: ${job.recruiterEmail}\n`;
        }
        if (job.emailId) {
            description += `\nOriginal email: https://mail.google.com/mail/u/0/#inbox/${job.emailId}`;
        }

        // Parse interview date
        const dateStr = this.parseDate(job.interviewDate);

        return {
            summary,
            description,
            start: {
                date: dateStr,
            },
            end: {
                date: dateStr,
            },
            location: this.getLocation(job.interviewType),
        };
    }

    private parseDate(dateStr: string): string {
        // Try to parse various date formats and return YYYY-MM-DD
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (error) {
            console.warn('Failed to parse date:', dateStr);
        }

        // If parsing fails, return today's date
        return new Date().toISOString().split('T')[0];
    }

    private getLocation(interviewType?: string): string {
        switch (interviewType?.toLowerCase()) {
            case 'video':
                return 'Video Call (check email for link)';
            case 'phone':
                return 'Phone Call';
            case 'onsite':
                return 'Company Office';
            default:
                return 'TBD';
        }
    }

    validate(config: any): boolean {
        return typeof config.userId === 'string' && config.userId.length > 0;
    }
}
