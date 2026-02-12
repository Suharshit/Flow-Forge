
const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// The parent page ID (your "Job Tracker" page)
const PARENT_PAGE_ID = '30527953-9ea5-80e5-8bf0-ce43a04d5788';

async function createFullPageDatabase() {
    console.log('Creating a full-page Job Tracker database via API...\n');

    try {
        const db = await notion.databases.create({
            parent: { page_id: PARENT_PAGE_ID },
            title: [{ text: { content: 'Job Tracker' } }],
            properties: {
                Company: { title: {} },
                Position: { rich_text: {} },
                Status: {
                    select: {
                        options: [
                            { name: 'New', color: 'blue' },
                            { name: 'Applied', color: 'yellow' },
                            { name: 'Interview Scheduled', color: 'orange' },
                            { name: 'Interviewed', color: 'purple' },
                            { name: 'Offer', color: 'green' },
                            { name: 'Rejected', color: 'red' },
                        ],
                    },
                },
                'Interview Date': { date: {} },
                'Interview Type': {
                    select: {
                        options: [
                            { name: 'Phone', color: 'blue' },
                            { name: 'Video', color: 'green' },
                            { name: 'Onsite', color: 'orange' },
                        ],
                    },
                },
                'Recruiter Name': { rich_text: {} },
                'Recruiter Email': { email: {} },
                'Email Link': { url: {} },
                Priority: {
                    select: {
                        options: [
                            { name: 'High', color: 'red' },
                            { name: 'Medium', color: 'yellow' },
                            { name: 'Low', color: 'blue' },
                        ],
                    },
                },
                Notes: { rich_text: {} },
            },
        });

        console.log('✅ Database created!');
        console.log(`   Title: Job Tracker`);
        console.log(`   ID: ${db.id}`);
        console.log(`   URL: ${db.url}`);

        // Test: create a page in the new database
        console.log('\nTesting page creation...');
        const page = await notion.pages.create({
            parent: { database_id: db.id },
            properties: {
                Company: { title: [{ text: { content: 'Test Company (delete me)' } }] },
                Position: { rich_text: [{ text: { content: 'Software Engineer' } }] },
                Status: { select: { name: 'New' } },
                Priority: { select: { name: 'High' } },
            },
        });
        console.log(`✅ Test page created! ID: ${page.id}`);

        console.log('\n🎉 EVERYTHING WORKS!');
        console.log(`\n📋 Use this Database ID in your workflows:`);
        console.log(`   ${db.id}`);
        console.log(`\n   Open in Notion: ${db.url}`);
        console.log(`\n   Delete the "Test Company" row from Notion when done.`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.body) console.error('   Details:', error.body);
    }
}

createFullPageDatabase();
