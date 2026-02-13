import { Router, Request, Response } from 'express';
import { WorkflowService } from '../../services/workflow.service';
import { WorkflowExecutionService } from '../../services/workflow-execution.service';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();
const workflowService = new WorkflowService();
const executionService = new WorkflowExecutionService();

// Apply auth middleware to all workflow routes
router.use(authenticateToken);

/**
 * GET /api/workflows/runs/:id
 * Get specific run details
 */
router.get('/runs/:id', async (req: Request, res: Response) => {
    try {
        const run = await executionService.getRunById(req.params.id as string);

        if (!run) {
            return res.status(404).json({ success: false, error: 'Run not found' });
        }

        res.json({ success: true, data: run });
    } catch (error) {
        console.error('Error fetching run:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/workflows
 * Get all workflows for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const activeOnly = req.query.active === 'true';
        const workflows = await workflowService.getAllWorkflows(userId, activeOnly);
        res.json({ success: true, data: workflows });
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/workflows/schedules
 * Get all scheduled jobs
 */
router.get('/schedules', async (req: Request, res: Response) => {
    try {
        const jobs = await workflowService.getScheduledJobs();
        res.json({ success: true, data: jobs });
    } catch (error) {
        console.error('Error fetching scheduled jobs:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/workflows/:id
 * Get a specific workflow
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const workflow = await workflowService.getWorkflow(req.params.id as string);

        if (!workflow) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }

        res.json({ success: true, data: workflow });
    } catch (error) {
        console.error('Error fetching workflow:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/workflows
 * Create a new workflow for the authenticated user
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const workflow = await workflowService.createWorkflow(userId, req.body);
        res.status(201).json({ success: true, data: workflow });
    } catch (error) {
        console.error('Error creating workflow:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, error: message });
    }
});

/**
 * PATCH /api/workflows/:id
 * Update a workflow
 */
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const workflow = await workflowService.updateWorkflow(
            req.params.id as string,
            req.body
        );

        if (!workflow) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }

        res.json({ success: true, data: workflow });
    } catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * DELETE /api/workflows/:id
 * Delete a workflow
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const deleted = await workflowService.deleteWorkflow(req.params.id as string);

        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }

        res.json({ success: true, message: 'Workflow deleted' });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/workflows/:id/execute
 * Execute a workflow manually
 */
router.post('/:id/execute', async (req: Request, res: Response) => {
    try {
        const run = await executionService.executeWorkflow(req.params.id as string);
        res.json({ success: true, data: run });
    } catch (error) {
        console.error('Error executing workflow:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, error: message });
    }
});

/**
 * GET /api/workflows/:id/runs
 * Get execution history for a workflow
 */
router.get('/:id/runs', async (req: Request, res: Response) => {
    try {
        const runs = await executionService.getWorkflowRuns(req.params.id as string);
        res.json({ success: true, data: runs });
    } catch (error) {
        console.error('Error fetching workflow runs:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
