
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function test() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();
        console.log('Connected!');
        const res = await client.query('SELECT NOW()');
        console.log('Time:', res.rows[0]);

        // Check tables
        const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);
        console.log('Tables:', tables.rows.map(r => r.table_name));

        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

test();
