import { BaseStep, StepResult, StepContext } from './step.interface';

interface TransformStepConfig {
    input: any;
    operation: 'uppercase' | 'lowercase' | 'reverse' | 'json_parse' | 'json_stringify';
}

export class TransformStep extends BaseStep {
    constructor(config: TransformStepConfig) {
        super('TransformStep', config);
    }

    async execute(input: any, context: StepContext): Promise<StepResult> {
        try {
            const config = this.config as TransformStepConfig;
            let data = config.input || input;

            let result: any;

            switch (config.operation) {
                case 'uppercase':
                    result = String(data).toUpperCase();
                    break;

                case 'lowercase':
                    result = String(data).toLowerCase();
                    break;

                case 'reverse':
                    result = String(data).split('').reverse().join('');
                    break;

                case 'json_parse':
                    result = JSON.parse(String(data));
                    break;

                case 'json_stringify':
                    result = JSON.stringify(data);
                    break;

                default:
                    return this.failure(`Unknown operation: ${config.operation}`);
            }

            return this.success(result);
        } catch (error) {
            return this.failure(`Transform failed: ${error}`);
        }
    }

    validate(config: any): boolean {
        const validOps = ['uppercase', 'lowercase', 'reverse', 'json_parse', 'json_stringify'];
        return validOps.includes(config.operation);
    }
}
