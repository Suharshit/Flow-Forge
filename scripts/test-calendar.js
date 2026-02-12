
const { google } = require('googleapis');
const { Client } = require('pg');
require('dotenv').config();

// Check env vars
console.log('=== Google Calendar Debug ===\n');
console.log('GMAIL_CLIENT_ID:', process.env.GMAIL_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('GMAIL_CLIENT_SECRET:', process.env.GMAIL_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CALENDAR_REDIRECT_URI:', process.env.GOOGLE_CALENDAR_REDIRECT_URI || '❌ Missing');

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

// Generate auth URL for testing
const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
});

console.log('\n=== Auth URL ===');
console.log(authUrl);

// Check if credentials exist in DB
const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function checkDB() {
    console.log('\n=== Checking DB for stored credentials ===');
    try {
        await client.connect();

        const result = await client.query(
            "SELECT id, user_id, service, token_expiry, created_at FROM user_credentials WHERE service = 'google-calendar'"
        );

        if (result.rows.length === 0) {
            console.log('❌ No google-calendar credentials found in DB.');
            console.log('   The OAuth callback likely never completed successfully.');
            console.log('\n=== Possible causes ===');
            console.log('   1. The redirect URI in Google Cloud Console doesn\'t match .env');
            console.log('      Expected: ' + process.env.GOOGLE_CALENDAR_REDIRECT_URI);
            console.log('   2. Google Calendar API is not enabled in your Google Cloud project');
            console.log('   3. calendar.events scope is not added to your OAuth consent screen');
        } else {
            console.log('✅ Found credentials:');
            result.rows.forEach(row => {
                console.log(`   User: ${row.user_id}`);
                console.log(`   Service: ${row.service}`);
                console.log(`   Created: ${row.created_at}`);
                console.log(`   Token Expiry: ${row.token_expiry}`);
            });
        }

        // Also check Gmail credentials for comparison
        const gmailResult = await client.query(
            "SELECT id, user_id, service FROM user_credentials WHERE service = 'gmail'"
        );
        console.log(`\nGmail credentials in DB: ${gmailResult.rows.length > 0 ? '✅ Yes' : '❌ No'}`);

    } catch (err) {
        console.error('DB Error:', err.message);
    }

    await client.end();
}

checkDB();
