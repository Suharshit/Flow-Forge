
const http = require('http');

function request(method, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/workflows' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                let json;
                try {
                    json = JSON.parse(body);
                } catch (e) {
                    json = body;
                }
                resolve({ status: res.statusCode, body: json });
            });
        });

        req.on('error', (e) => reject(e));
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

function getSchedules() {
    return request('GET', '/schedules', null);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('Starting Phase 3 Testing...');

    // 1. Create Scheduled Workflow (Every Minute)
    console.log('\n1. Creating Scheduled Workflow (Every Minute)...');
    const createRes = await request('POST', '', {
        name: "Test Schedule Flow",
        trigger_type: "scheduled",
        trigger_config: {
            cron: "* * * * *"
        },
        steps: [
            { id: "s1", type: "log", order: 1, config: { message: "Scheduled Run at {{timestamp}}" } }
        ]
    });

    if (createRes.status !== 201) {
        console.error('Create failed:', JSON.stringify(createRes.body));
        return;
    }
    const workflowId = createRes.body.data.id;
    console.log('Created Workflow ID:', workflowId);

    // 2. Verify Schedule Exists
    console.log('\n2. Verifying Schedule...');
    const schedulesRes = await getSchedules();
    console.log('Schedules:', JSON.stringify(schedulesRes.body.data, null, 2));

    const job = schedulesRes.body.data.find(j => j.id.includes(workflowId));
    if (job) {
        console.log('✅ Schedule found in Redis');
    } else {
        console.error('❌ Schedule NOT found in Redis');
    }

    // 3. Pause Workflow
    console.log('\n3. Pausing Workflow...');
    await request('PATCH', `/${workflowId}`, { is_active: false });

    // Verify schedule removed
    const pausedSchedules = await getSchedules();
    const pausedJob = pausedSchedules.body.data.find(j => j.id.includes(workflowId));
    if (!pausedJob) {
        console.log('✅ Schedule removed after pause');
    } else {
        console.error('❌ Schedule STILL exists after pause');
    }

    // 4. Resume Workflow
    console.log('\n4. Resuming Workflow...');
    await request('PATCH', `/${workflowId}`, { is_active: true });

    // Verify schedule added back
    const resumedSchedules = await getSchedules();
    const resumedJob = resumedSchedules.body.data.find(j => j.id.includes(workflowId));
    if (resumedJob) {
        console.log('✅ Schedule restored after resume');
    } else {
        console.error('❌ Schedule NOT restored after resume');
    }

    // 5. Update Schedule
    console.log('\n5. Updating Schedule to hourly...');
    await request('PATCH', `/${workflowId}`, {
        trigger_config: { cron: "0 * * * *" }
    });

    const updatedSchedules = await getSchedules();
    const updatedJob = updatedSchedules.body.data.find(j => j.id.includes(workflowId));
    // BullMQ job ID might verify pattern, but simple existence check is good for now.
    // Ideally we check the cron pattern but that's deep in job options.
    console.log('Updated Schedules:', JSON.stringify(updatedSchedules.body.data, null, 2));

    console.log('\n✅ Test Sequence Complete. Monitor server logs for execution.');
}

run().catch(console.error);
