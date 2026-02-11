import { Queue } from 'bullmq';
import { redis } from '../config/redis';

export interface WorkflowJobData {
    workflowId: string;
    triggeredBy: 'schedule' | 'manual';
}

// Create workflow queue
export const workflowQueue = new Queue<WorkflowJobData>('workflow-execution', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3, // Retry failed jobs 3 times
        backoff: {
            type: 'exponential',
            delay: 5000, // Start with 5 second delay, doubles each retry
        },
        removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 jobs
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
    },
});

console.log('📋 Workflow queue initialized');
