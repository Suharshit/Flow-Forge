import { Step } from '../steps/step.interface';
import { LogStep } from '../steps/log.step';
import { TransformStep } from '../steps/transform.step';
import { ValidateStep } from '../steps/validate.step';
import { FetchGmailStep } from '../steps/fetch-gmail.step';
import { ClassifyEmailStep } from '../steps/classify-email.step';
import { ExtractJobDataStep } from '../steps/extract-job-data.step';
import { MarkEmailReadStep } from '../steps/mark-email-read.step';
import { AppendToNotionStep } from '../steps/append-to-notion.step';
import { CreateCalendarEventStep } from '../steps/create-calendar-event.step';

type StepConstructor = new (config: any) => Step;

export class StepRegistry {
    private steps: Map<string, StepConstructor> = new Map();

    constructor() {
        this.registerDefaultSteps();
    }

    private registerDefaultSteps(): void {
        this.register('log', LogStep);
        this.register('transform', TransformStep);
        this.register('validate', ValidateStep);

        // Gmail steps
        this.register('fetch_gmail', FetchGmailStep);
        this.register('classify_email', ClassifyEmailStep);
        this.register('extract_job_data', ExtractJobDataStep);
        this.register('mark_email_read', MarkEmailReadStep);

        // Notion steps
        this.register('append_to_notion', AppendToNotionStep);

        // Calendar steps
        this.register('create_calendar_event', CreateCalendarEventStep);
    }

    register(type: string, stepClass: StepConstructor): void {
        this.steps.set(type, stepClass);
    }

    create(type: string, config: any): Step {
        const StepClass = this.steps.get(type);

        if (!StepClass) {
            throw new Error(`Step type '${type}' not found in registry`);
        }

        const step = new StepClass(config);

        // Validate configuration if step has validate method
        if (step.validate && !step.validate(config)) {
            throw new Error(`Invalid configuration for step type '${type}'`);
        }

        return step;
    }

    has(type: string): boolean {
        return this.steps.has(type);
    }

    getRegisteredTypes(): string[] {
        return Array.from(this.steps.keys());
    }
}

// Export singleton instance
export const stepRegistry = new StepRegistry();
