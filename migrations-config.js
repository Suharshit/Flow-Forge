require('dotenv').config();

module.exports = {
    databaseUrl: process.env.DATABASE_URL,
    migrationsTable: 'pgmigrations',
    dir: 'src/db/migrations',
    direction: 'up',
    count: Infinity,
    createSchema: true,
    createMigrationsSchema: true,
};