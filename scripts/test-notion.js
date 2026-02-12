
const { Client } = require('@notionhq/client');
require('dotenv').config();

const DATABASE_ID = '305279539ea580e68963ee93a7c34112';
const DATA_SOURCE_ID = '30527953-9ea5-8042-8f2f-000ba97f924d';

async function test() {
    console.log('=== Notion API Version Test ===\n');

    // Check package version
    const pkg = require('@notionhq/client/package.json');
    console.log('@notionhq/client version:', pkg.version);

    // Test 1: Try with older API version (2022-06-28) which has properties
    console.log('\n--- Test 1: Using API version 2022-06-28 ---');
    const notionOld = new Client({
        auth: process.env.NOTION_TOKEN,
        notionVersion: '2022-06-28',
    });

    try {
        const db = await notionOld.databases.retrieve({ database_id: DATABASE_ID });
        const props = db.properties ? Object.keys(db.properties) : [];
        console.log('Properties:', props.length > 0 ? props.join(', ') : 'NONE');

        if (props.length > 0) {
            // Find title property
            const titleProp = Object.entries(db.properties).find(([, v]) => v.type === 'title');
            console.log('Title property:', titleProp ? titleProp[0] : 'not found');

            // Try creating a page
            console.log('\nCreating test page...');
            const properties = {};
            properties[titleProp[0]] = { title: [{ text: { content: 'Test Company (delete me)' } }] };

            const page = await notionOld.pages.create({
                parent: { database_id: DATABASE_ID },
                properties,
            });
            console.log('✅ Page created! ID:', page.id);
            console.log('\n🎉 SUCCESS with API version 2022-06-28!');
            console.log('Database ID:', DATABASE_ID);
            return;
        }
    } catch (error) {
        console.log('❌', error.message);
    }

    // Test 2: Try with data_source ID
    console.log('\n--- Test 2: Using data_source ID ---');
    const notion = new Client({ auth: process.env.NOTION_TOKEN });

    try {
        const page = await notion.pages.create({
            parent: { database_id: DATA_SOURCE_ID },
            properties: {
                Name: { title: [{ text: { content: 'Test Company (delete me)' } }] },
            },
        });
        console.log('✅ Page created with data_source ID! ID:', page.id);
        console.log('\n🎉 SUCCESS with data_source ID!');
        console.log('Use this ID:', DATA_SOURCE_ID);
    } catch (error) {
        console.log('❌', error.message);
    }
}

test();
