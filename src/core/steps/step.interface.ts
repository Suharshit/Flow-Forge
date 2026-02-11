

export interface StepResult {
    success: boolean;
    output?: any;
    error?: string;
}

export interface StepContext {
    workflowRunId: string;
    previousResults: Record<string, any>;
    workflowConfig: any;
}

export interface Step {
    name: string;

    execute(input: any, context: StepContext): Promise<StepResult>;

    validate?(config: any): boolean;
}

export abstract class BaseStep implements Step {
    constructor(
        public name: string,
        protected config: any
    ) { }

    abstract execute(input: any, context: StepContext): Promise<StepResult>;

    validate(config: any): boolean {
        return true;
    }

    protected success(output?: any): StepResult {
        return { success: true, output };
    }

    protected failure(error: string): StepResult {
        return { success: false, error };
    }
}
