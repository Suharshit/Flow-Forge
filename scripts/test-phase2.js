
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

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('Starting Testing (http)...');

    // 1. Create
    console.log('Creating flow...');
    const createRes = await request('POST', '', {
        name: "Test Flow",
        trigger_type: "manual",
        trigger_config: {},
        steps: [
            { id: "s1", type: "log", order: 1, config: { message: "Hello" } },
            { id: "s2", type: "transform", order: 2, config: { input: "foo", operation: "uppercase" } },
            { id: "s3", type: "log", order: 3, config: { message: "Result: {{s2.output}}" } }
        ]
    });

    if (createRes.status !== 201 && createRes.status !== 200) {
        console.error('Create failed:', JSON.stringify(createRes.body));
        return;
    }

    const id = createRes.body.data.id;
    console.log('Created Workflow ID:', id);

    // 2. Execute
    console.log('Executing...');
    const execRes = await request('POST', `/${id}/execute`, {});
    if (execRes.status !== 200 && execRes.status !== 201) {
        console.error('Execute failed:', JSON.stringify(execRes.body));
        return;
    }
    const runId = execRes.body.data.id;
    console.log('Execution Run ID:', runId);

    // 3. Get Run Details
    // Poll for completion? The execution is sync in controller (awaited).
    // So current status should be completed.

    console.log('Getting run status...');
    const runRes = await request('GET', `/runs/${runId}`);
    if (runRes.status !== 200) {
        console.error('Get Run failed:', JSON.stringify(runRes.body));
        return;
    }

    const runData = runRes.body.data;
    console.log('Run Status:', runData.status);
    console.log('Logs:', JSON.stringify(runData.execution_logs, null, 2));
    console.log('Results:', JSON.stringify(runData.step_results, null, 2));

    // 4. Validate Flow
    console.log('\nCreating Validation Flow...');
    const valRes = await request('POST', '', {
        name: "Validation Flow",
        trigger_type: "manual",
        trigger_config: {},
        steps: [
            {
                id: "v1",
                type: "validate",
                order: 1,
                config: {
                    data: { email: "bad-email" },
                    rules: [{ field: "email", type: "email" }]
                }
            }
        ]
    });

    const valId = valRes.body.data.id;
    console.log('Validation Workflow ID:', valId);

    console.log('Executing Validation Flow...');
    const valExecRes = await request('POST', `/${valId}/execute`, {});
    const valRunId = valExecRes.body.data.id;
    console.log('Validation Run ID:', valRunId);

    const valRunRes = await request('GET', `/runs/${valRunId}`);
    console.log('Validation Run Status:', valRunRes.body.data.status); // Should be failed
    console.log('Validation Run Error:', valRunRes.body.data.error_message);
}

run().catch(console.error);
