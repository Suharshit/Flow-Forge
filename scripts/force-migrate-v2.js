
const { Client } = require('pg');

// Hardcoded for emergency migration - relying on parameters in string
const connectionString = 'postgresql://neondb_owner:npg_T85DMPSutrEZ@ep-round-bonus-a1jfiic0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
    connectionString: connectionString
    // Removed explicit ssl object to let connection string control it
});

console.log('Attempting connection (v2)...');

client.connect().then(async () => {
    console.log('Connected to DB successfully.');

    try {
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
            )
        `);
        console.log('Table created or already exists.');

        console.log('Creating indices...');
        await client.query("CREATE INDEX IF NOT EXISTS workflow_runs_workflow_id_idx ON workflow_runs (workflow_id)");
        await client.query("CREATE INDEX IF NOT EXISTS workflow_runs_status_idx ON workflow_runs (status)");
        console.log('Indices created.');

        console.log('Migration SUCCESS.');
    } catch (err) {
        console.error('Migration SQL Error:', err);
    }

    await client.end();
    process.exit(0);
}).catch(e => {
    console.error('Connection Error:', e);
    process.exit(1);
});
