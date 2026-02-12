
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fix() {
    console.log('Fixing user_credentials CHECK constraint...\n');

    try {
        await client.connect();
        console.log('✅ Connected to DB');

        // Drop old constraint
        await client.query('ALTER TABLE user_credentials DROP CONSTRAINT IF EXISTS user_credentials_service_check');
        console.log('✅ Dropped old constraint');

        // Add new constraint with google-calendar
        await client.query(`
            ALTER TABLE user_credentials 
            ADD CONSTRAINT user_credentials_service_check 
            CHECK (service IN ('gmail', 'notion', 'google-calendar', 'slack'))
        `);
        console.log('✅ Added new constraint (includes google-calendar)');

        // Verify
        const result = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conrelid = 'user_credentials'::regclass AND contype = 'c'
        `);
        console.log('\nCurrent constraints:');
        result.rows.forEach(r => console.log(`   ${r.conname}: ${r.definition}`));

        console.log('\n🎉 Done! Restart your server and try Google Calendar auth again.');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }

    await client.end();
}

fix();
