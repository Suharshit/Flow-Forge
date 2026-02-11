
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();
        console.log('Connected!');

        console.log('Creating workflow_runs table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS workflow_runs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
        status varchar(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
        started_at timestamp NOT NULL DEFAULT current_timestamp,
        completed_at timestamp,
        error_message text,
        execution_logs jsonb DEFAULT '[]',
        step_results jsonb DEFAULT '{}'
      );
    `);

        console.log('Creating indices...');
        await client.query(`CREATE INDEX IF NOT EXISTS workflow_runs_workflow_id_idx ON workflow_runs (workflow_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS workflow_runs_status_idx ON workflow_runs (status);`);

        console.log('Migration completed successfully.');
        client.release();
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
