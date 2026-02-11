import { WorkflowRepository } from '../db/repositories/workflow.repository';
import {
    Workflow,
    CreateWorkflowDTO,
    UpdateWorkflowDTO,
} from '../types/workflow.types';
import { SchedulerService } from './scheduler.service';

export class WorkflowService {
    private workflowRepo: WorkflowRepository;
    private schedulerService: SchedulerService;

    constructor() {
        this.workflowRepo = new WorkflowRepository();
        this.schedulerService = new SchedulerService();
    }

    async createWorkflow(data: CreateWorkflowDTO): Promise<Workflow> {
        const workflow = await this.workflowRepo.create(data);

        // If workflow is scheduled type and active, schedule it
        if (workflow.trigger_type === 'scheduled' && workflow.is_active) {
            await this.schedulerService.scheduleWorkflow(workflow);
        }

        return workflow;
    }

    async getWorkflow(id: string): Promise<Workflow | null> {
        return await this.workflowRepo.findById(id);
    }

    async getAllWorkflows(activeOnly?: boolean): Promise<Workflow[]> {
        const filters = activeOnly !== undefined ? { is_active: activeOnly } : undefined;
        return await this.workflowRepo.findAll(filters);
    }

    async updateWorkflow(
        id: string,
        data: UpdateWorkflowDTO
    ): Promise<Workflow | null> {
        const existingWorkflow = await this.workflowRepo.findById(id);

        if (!existingWorkflow) {
            return null;
        }

        const updatedWorkflow = await this.workflowRepo.update(id, data);

        if (!updatedWorkflow) {
            return null;
        }

        // Handle schedule updates
        if (updatedWorkflow.trigger_type === 'scheduled') {
            if (updatedWorkflow.is_active) {
                // Reschedule if active (handles cron changes too)
                await this.schedulerService.rescheduleWorkflow(updatedWorkflow);
            } else {
                // Unschedule if deactivated
                await this.schedulerService.unscheduleWorkflow(updatedWorkflow.id);
            }
        }

        return updatedWorkflow;
    }

    async deleteWorkflow(id: string): Promise<boolean> {
        const workflow = await this.workflowRepo.findById(id);

        if (workflow && workflow.trigger_type === 'scheduled') {
            // Remove schedule before deleting
            await this.schedulerService.unscheduleWorkflow(id);
        }

        return await this.workflowRepo.delete(id);
    }

    async getScheduledJobs() {
        return await this.schedulerService.getScheduledJobs();
    }
}
