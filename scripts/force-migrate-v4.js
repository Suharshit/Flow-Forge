
const { Client } = require('pg');

// Use same connection approach as previous migration scripts
const connectionString = 'postgresql://neondb_owner:npg_T85DMPSutrEZ@ep-round-bonus-a1jfiic0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

console.log('Attempting connection for user_credentials migration...');

client.connect().then(async () => {
    console.log('Connected to DB successfully.');

    try {
        console.log('Creating user_credentials table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_credentials (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id varchar(255) NOT NULL,
                service varchar(50) NOT NULL CHECK (service IN ('gmail', 'notion', 'google-calendar', 'slack')),
                access_token text NOT NULL,
                refresh_token text,
                token_expiry timestamp,
                created_at timestamp NOT NULL DEFAULT current_timestamp,
                updated_at timestamp NOT NULL DEFAULT current_timestamp
            )
        `);
        console.log('Table created or already exists.');

        console.log('Creating unique index on user_id + service...');
        await client.query(
            "CREATE UNIQUE INDEX IF NOT EXISTS user_credentials_user_id_service_idx ON user_credentials (user_id, service)"
        );
        console.log('Index created.');

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
