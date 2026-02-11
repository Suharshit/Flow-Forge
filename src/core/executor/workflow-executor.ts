import { WorkflowRunRepository } from '../../db/repositories/workflow-run.repository';
import { Workflow } from '../../types/workflow.types';
import { WorkflowRun, LogEntry } from '../../types/workflow-run.types';
import { stepRegistry } from '../registry/step-registry';
import { StepContext } from '../steps/step.interface';

export class WorkflowExecutor {
    private runRepository: WorkflowRunRepository;

    constructor() {
        this.runRepository = new WorkflowRunRepository();
    }

    async execute(workflow: Workflow): Promise<WorkflowRun> {
        // Create workflow run record
        const run = await this.runRepository.create({
            workflow_id: workflow.id,
        });

        try {
            await this.log(run.id, 'info', `Starting workflow: ${workflow.name}`);

            // Update status to running
            await this.runRepository.updateStatus(run.id, 'running');

            // Sort steps by order
            const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);

            // Track results from previous steps
            const stepResults: Record<string, any> = {};

            // Execute each step sequentially
            for (const stepConfig of sortedSteps) {
                await this.log(
                    run.id,
                    'info',
                    `Executing step ${stepConfig.id} (${stepConfig.type})`,
                    stepConfig.id
                );

                try {
                    // Create step instance from registry
                    const step = stepRegistry.create(stepConfig.type, stepConfig.config);

                    // Build context for step execution
                    const context: StepContext = {
                        workflowRunId: run.id,
                        previousResults: stepResults,
                        workflowConfig: workflow.trigger_config,
                    };

                    // Execute the step
                    const result = await step.execute(null, context);

                    // Save step result
                    await this.runRepository.updateStepResult(
                        run.id,
                        stepConfig.id,
                        result
                    );

                    // Store result for future steps
                    stepResults[stepConfig.id] = result.output;

                    if (!result.success) {
                        throw new Error(result.error || 'Step execution failed');
                    }

                    await this.log(
                        run.id,
                        'info',
                        `Step ${stepConfig.id} completed successfully`,
                        stepConfig.id
                    );
                } catch (stepError) {
                    await this.log(
                        run.id,
                        'error',
                        `Step ${stepConfig.id} failed: ${stepError}`,
                        stepConfig.id
                    );
                    throw stepError;
                }
            }

            // Mark as completed
            await this.runRepository.updateStatus(run.id, 'completed');
            await this.log(run.id, 'info', 'Workflow completed successfully');

            // Return updated run
            return (await this.runRepository.findById(run.id))!;
        } catch (error) {
            // Mark as failed
            const errorMessage = error instanceof Error ? error.message : String(error);
            await this.runRepository.updateStatus(run.id, 'failed', errorMessage);
            await this.log(run.id, 'error', `Workflow failed: ${errorMessage}`);

            // Return failed run
            return (await this.runRepository.findById(run.id))!;
        }
    }

    private async log(
        runId: string,
        level: 'info' | 'warn' | 'error',
        message: string,
        stepId?: string
    ): Promise<void> {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            stepId,
        };

        await this.runRepository.addLog(runId, logEntry);
        console.log(`[${level.toUpperCase()}] ${message}`);
    }
}
