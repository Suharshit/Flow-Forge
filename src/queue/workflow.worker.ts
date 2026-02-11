import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { WorkflowJobData } from './workflow.queue';
import { WorkflowExecutionService } from '../services/workflow-execution.service';

const executionService = new WorkflowExecutionService();

// Create worker to process workflow jobs
export const workflowWorker = new Worker<WorkflowJobData>(
    'workflow-execution',
    async (job: Job<WorkflowJobData>) => {
        const { workflowId, triggeredBy } = job.data;

        console.log(`🔄 Processing job ${job.id} for workflow ${workflowId} (triggered by: ${triggeredBy})`);

        try {
            // Execute the workflow
            const run = await executionService.executeWorkflow(workflowId);

            console.log(`✅ Job ${job.id} completed. Run ID: ${run.id}, Status: ${run.status}`);

            return {
                success: true,
                runId: run.id,
                status: run.status,
            };
        } catch (error) {
            console.error(`❌ Job ${job.id} failed:`, error);
            throw error; // Re-throw to trigger retry
        }
    },
    {
        connection: redis,
        concurrency: 5, // Process up to 5 jobs simultaneously
    }
);

// Worker event handlers
workflowWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} has been completed`);
});

workflowWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} has failed with error:`, err.message);
});

workflowWorker.on('error', (err) => {
    console.error('Worker error:', err);
});

console.log('👷 Workflow worker started');
