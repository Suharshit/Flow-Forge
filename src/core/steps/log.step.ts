import { BaseStep, StepResult, StepContext } from './step.interface';

interface LogStepConfig {
    message: string;
    level?: 'info' | 'warn' | 'error';
}

export class LogStep extends BaseStep {
    constructor(config: LogStepConfig) {
        super('LogStep', config);
    }

    async execute(input: any, context: StepContext): Promise<StepResult> {
        try {
            const config = this.config as LogStepConfig;
            const level = config.level || 'info';

            // Replace template variables like {{step-1.output}}
            let message = config.message;

            // Simple template replacement
            const templateRegex = /\{\{(.+?)\}\}/g;
            message = message.replace(templateRegex, (match, path) => {
                const keys = path.trim().split('.');
                let value = context.previousResults;

                for (const key of keys) {
                    value = value?.[key];
                }

                return value !== undefined ? String(value) : match;
            });

            console.log(`[${level.toUpperCase()}] ${message}`);

            return this.success({
                message,
                level,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            return this.failure(`Failed to log: ${error}`);
        }
    }

    validate(config: any): boolean {
        return typeof config.message === 'string' && config.message.length > 0;
    }
}
