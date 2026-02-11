import { pool } from '../../config/database';
import {
    WorkflowRun,
    CreateWorkflowRunDTO,
    WorkflowRunStatus,
    LogEntry,
} from '../../types/workflow-run.types';

export class WorkflowRunRepository {
    async create(data: CreateWorkflowRunDTO): Promise<WorkflowRun> {
        const query = `
      INSERT INTO workflow_runs (workflow_id, status)
      VALUES ($1, $2)
      RETURNING *
    `;

        const result = await pool.query(query, [data.workflow_id, 'pending']);
        return this.mapRowToWorkflowRun(result.rows[0]);
    }

    async findById(id: string): Promise<WorkflowRun | null> {
        const query = 'SELECT * FROM workflow_runs WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRowToWorkflowRun(result.rows[0]);
    }

    async findByWorkflowId(workflowId: string): Promise<WorkflowRun[]> {
        const query = `
      SELECT * FROM workflow_runs
      WHERE workflow_id = $1
      ORDER BY started_at DESC
      LIMIT 100
    `;

        const result = await pool.query(query, [workflowId]);
        return result.rows.map(row => this.mapRowToWorkflowRun(row));
    }

    async updateStatus(
        id: string,
        status: WorkflowRunStatus,
        errorMessage?: string
    ): Promise<void> {
        let query = `
      UPDATE workflow_runs
      SET status = $1
    `;

        const values: any[] = [status];
        let paramCount = 2;

        if (status === 'completed' || status === 'failed') {
            query += `, completed_at = current_timestamp`;
        }

        if (errorMessage) {
            query += `, error_message = $${paramCount++}`;
            values.push(errorMessage);
        }

        query += ` WHERE id = $${paramCount}`;
        values.push(id);

        await pool.query(query, values);
    }

    async addLog(id: string, log: LogEntry): Promise<void> {
        const query = `
      UPDATE workflow_runs
      SET execution_logs = execution_logs || $1::jsonb
      WHERE id = $2
    `;

        await pool.query(query, [JSON.stringify(log), id]);
    }

    async updateStepResult(
        id: string,
        stepId: string,
        result: any
    ): Promise<void> {
        const query = `
      UPDATE workflow_runs
      SET step_results = jsonb_set(
        step_results,
        $1,
        $2::jsonb
      )
      WHERE id = $3
    `;

        await pool.query(query, [`{${stepId}}`, JSON.stringify(result), id]);
    }

    private mapRowToWorkflowRun(row: any): WorkflowRun {
        return {
            id: row.id,
            workflow_id: row.workflow_id,
            status: row.status,
            started_at: row.started_at,
            completed_at: row.completed_at,
            error_message: row.error_message,
            execution_logs: row.execution_logs || [],
            step_results: row.step_results || {},
        };
    }
}
