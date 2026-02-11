import { workflowQueue } from '../queue/workflow.queue';
import { Workflow } from '../types/workflow.types';

export class SchedulerService {
    /**
     * Schedule a workflow based on its trigger configuration
     * The cron expression comes from user input in trigger_config.cron
     */
    async scheduleWorkflow(workflow: Workflow): Promise<void> {
        if (workflow.trigger_type !== 'scheduled') {
            throw new Error('Workflow is not a scheduled type');
        }

        const cronExpression = workflow.trigger_config.cron;

        if (!cronExpression) {
            throw new Error('Cron expression is required for scheduled workflows');
        }

        // Validate cron expression (basic validation)
        if (!this.isValidCron(cronExpression)) {
            throw new Error(`Invalid cron expression: ${cronExpression}`);
        }

        // Create repeatable job with user-specified cron schedule
        await workflowQueue.add(
            `workflow-${workflow.id}`,
            {
                workflowId: workflow.id,
                triggeredBy: 'schedule',
            },
            {
                repeat: {
                    pattern: cronExpression, // User-defined schedule
                },
                jobId: `scheduled-${workflow.id}`, // Unique job ID for this workflow
            }
        );

        console.log(`📅 Scheduled workflow ${workflow.id} (${workflow.name}) with cron: ${cronExpression}`);
    }

    /**
     * Remove scheduled job for a workflow
     */
    async unscheduleWorkflow(workflowId: string): Promise<void> {
        const jobId = `scheduled-${workflowId}`;

        // Remove repeatable job
        await workflowQueue.removeRepeatable({
            jobId,
        });

        console.log(`🗑️  Unscheduled workflow ${workflowId}`);
    }

    /**
     * Reschedule a workflow (remove old schedule and create new one)
     */
    async rescheduleWorkflow(workflow: Workflow): Promise<void> {
        try {
            await this.unscheduleWorkflow(workflow.id);
        } catch (error) {
            // Ignore if no existing schedule
            console.log(`No existing schedule found for workflow ${workflow.id}`);
        }

        await this.scheduleWorkflow(workflow);
    }

    /**
     * Get all scheduled jobs
     */
    async getScheduledJobs() {
        const repeatableJobs = await workflowQueue.getRepeatableJobs();
        return repeatableJobs;
    }

    /**
     * Basic cron validation
     * Cron format: minute hour day month day-of-week
     * Example: "0 6,20 * * *" = 6 AM and 8 PM daily
     */
    private isValidCron(cron: string): boolean {
        // Basic validation: must have 5 parts separated by spaces
        const parts = cron.trim().split(/\s+/);
        if (parts.length !== 5) {
            return false;
        }

        // Each part should contain valid characters (numbers, *, /, -, ,)
        const validPattern = /^[\d\*\/\-,]+$/;
        return parts.every(part => validPattern.test(part));
    }

    /**
     * Add a one-time job to execute workflow immediately
     */
    async executeNow(workflowId: string): Promise<void> {
        await workflowQueue.add(
            `manual-${workflowId}`,
            {
                workflowId,
                triggeredBy: 'manual',
            }
        );

        console.log(`▶️  Queued immediate execution for workflow ${workflowId}`);
    }
}
