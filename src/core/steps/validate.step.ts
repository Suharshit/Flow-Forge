import { BaseStep, StepResult, StepContext } from './step.interface';

interface ValidationRule {
    field: string;
    type: 'required' | 'email' | 'min_length' | 'max_length' | 'pattern';
    value?: any;
}

interface ValidateStepConfig {
    data: any;
    rules: ValidationRule[];
}

export class ValidateStep extends BaseStep {
    constructor(config: ValidateStepConfig) {
        super('ValidateStep', config);
    }

    async execute(input: any, context: StepContext): Promise<StepResult> {
        try {
            const config = this.config as ValidateStepConfig;
            const data = config.data || input;
            const errors: string[] = [];

            for (const rule of config.rules) {
                const fieldValue = data[rule.field];

                switch (rule.type) {
                    case 'required':
                        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
                            errors.push(`Field '${rule.field}' is required`);
                        }
                        break;

                    case 'email':
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(fieldValue)) {
                            errors.push(`Field '${rule.field}' must be a valid email`);
                        }
                        break;

                    case 'min_length':
                        if (String(fieldValue).length < rule.value) {
                            errors.push(`Field '${rule.field}' must be at least ${rule.value} characters`);
                        }
                        break;

                    case 'max_length':
                        if (String(fieldValue).length > rule.value) {
                            errors.push(`Field '${rule.field}' must be at most ${rule.value} characters`);
                        }
                        break;

                    case 'pattern':
                        const pattern = new RegExp(rule.value);
                        if (!pattern.test(fieldValue)) {
                            errors.push(`Field '${rule.field}' does not match required pattern`);
                        }
                        break;
                }
            }

            if (errors.length > 0) {
                return this.failure(errors.join(', '));
            }

            return this.success({ valid: true, data });
        } catch (error) {
            return this.failure(`Validation failed: ${error}`);
        }
    }

    validate(config: any): boolean {
        return Array.isArray(config.rules) && config.rules.length > 0;
    }
}
