import { workflowWorker } from './queue/workflow.worker';
import logger from './utils/logger';

// Flag to track if the worker is shutting down
let isShuttingDown = false;

const startWorker = async () => {
    try {
        logger.info('🚀 Worker started successfully');

        // Handle worker errors (connection issues, etc.)
        workflowWorker.on('error', (err) => {
            logger.error('❌ Worker error:', err);
        });

        workflowWorker.on('failed', (job, err) => {
            logger.error(`❌ Job ${job?.id} failed:`, err);
        });

        workflowWorker.on('completed', (job) => {
            logger.info(`✅ Job ${job.id} completed successfully`);
        });

    } catch (error) {
        logger.error('❌ Failed to start worker:', error);
        process.exit(1);
    }
};

const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`${signal} received. Starting graceful shutdown...`);

    try {
        await workflowWorker.close();
        logger.info('✅ Worker closed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
    }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
    logger.error('❌ Unhandled Rejection:', reason);
    gracefulShutdown('unhandledRejection');
});

// Start the worker
startWorker();
