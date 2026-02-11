import { WorkflowRepository } from '../db/repositories/workflow.repository';
import { WorkflowRunRepository } from '../db/repositories/workflow-run.repository';
import { WorkflowExecutor } from '../core/executor/workflow-executor';
import { WorkflowRun } from '../types/workflow-run.types';

export class WorkflowExecutionService {
    private workflowRepo: WorkflowRepository;
    private runRepo: WorkflowRunRepository;
    private executor: WorkflowExecutor;

    constructor() {
        this.workflowRepo = new WorkflowRepository();
        this.runRepo = new WorkflowRunRepository();
        this.executor = new WorkflowExecutor();
    }

    async executeWorkflow(workflowId: string): Promise<WorkflowRun> {
        // Fetch workflow
        const workflow = await this.workflowRepo.findById(workflowId);

        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }

        if (!workflow.is_active) {
            throw new Error(`Workflow ${workflowId} is not active`);
        }

        // Execute workflow
        return await this.executor.execute(workflow);
    }

    async getWorkflowRuns(workflowId: string): Promise<WorkflowRun[]> {
        return await this.runRepo.findByWorkflowId(workflowId);
    }

    async getRunById(runId: string): Promise<WorkflowRun | null> {
        return await this.runRepo.findById(runId);
    }
}
