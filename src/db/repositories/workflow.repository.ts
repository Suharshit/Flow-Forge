import { pool } from '../../config/database';
import {
    Workflow,
    CreateWorkflowDTO,
    UpdateWorkflowDTO,
} from '../../types/workflow.types';

export class WorkflowRepository {
    async create(data: CreateWorkflowDTO): Promise<Workflow> {
        const query = `
      INSERT INTO workflows (name, description, trigger_type, trigger_config, steps)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const values = [
            data.name,
            data.description || null,
            data.trigger_type,
            JSON.stringify(data.trigger_config),
            JSON.stringify(data.steps),
        ];

        const result = await pool.query(query, values);
        return this.mapRowToWorkflow(result.rows[0]);
    }

    async findById(id: string): Promise<Workflow | null> {
        const query = 'SELECT * FROM workflows WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRowToWorkflow(result.rows[0]);
    }

    async findAll(filters?: { is_active?: boolean }): Promise<Workflow[]> {
        let query = 'SELECT * FROM workflows';
        const values: any[] = [];

        if (filters?.is_active !== undefined) {
            query += ' WHERE is_active = $1';
            values.push(filters.is_active);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, values);
        return result.rows.map(row => this.mapRowToWorkflow(row));
    }

    async update(id: string, data: UpdateWorkflowDTO): Promise<Workflow | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(data.name);
        }

        if (data.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(data.description);
        }

        if (data.trigger_config !== undefined) {
            fields.push(`trigger_config = $${paramCount++}`);
            values.push(JSON.stringify(data.trigger_config));
        }

        if (data.steps !== undefined) {
            fields.push(`steps = $${paramCount++}`);
            values.push(JSON.stringify(data.steps));
        }

        if (data.is_active !== undefined) {
            fields.push(`is_active = $${paramCount++}`);
            values.push(data.is_active);
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        fields.push(`updated_at = current_timestamp`);
        values.push(id);

        const query = `
      UPDATE workflows
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRowToWorkflow(result.rows[0]);
    }

    async delete(id: string): Promise<boolean> {
        const query = 'DELETE FROM workflows WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rowCount !== null && result.rowCount > 0;
    }

    private mapRowToWorkflow(row: any): Workflow {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            trigger_type: row.trigger_type,
            trigger_config: row.trigger_config,
            steps: row.steps,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
}
