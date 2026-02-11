
const BASE_URL = 'http://localhost:3000/api/workflows';

async function runTests() {
    console.log('Starting Phase 2 Tests...');

    // 1. Create Hello World Workflow
    console.log('\n1. Creating Hello World Workflow...');
    const wf1Response = await fetch(`${BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: "Hello World Workflow",
            description: "A simple test workflow",
            trigger_type: "manual",
            trigger_config: {},
            steps: [
                {
                    id: "step-1",
                    type: "log",
                    order: 1,
                    config: {
                        message: "Workflow started!",
                        level: "info"
                    }
                },
                {
                    id: "step-2",
                    type: "transform",
                    order: 2,
                    config: {
                        input: "hello world",
                        operation: "uppercase"
                    }
                },
                {
                    id: "step-3",
                    type: "log",
                    order: 3,
                    config: {
                        message: "Transform result: {{step-2.output}}",
                        level: "info"
                    }
                }
            ]
        })
    });

    if (!wf1Response.ok) {
        const text = await wf1Response.text();
        throw new Error(`Failed to create workflow 1: ${wf1Response.status} ${text}`);
    }

    const wf1 = await wf1Response.json();
    if (!wf1.success) throw new Error(`Failed to create workflow 1: ${JSON.stringify(wf1)}`);
    const wf1Id = wf1.data.id;
    console.log(`Workflow 1 Created: ${wf1Id}`);

    // 2. Execute Workflow 1
    console.log('Executing Workflow 1...');
    const exec1Response = await fetch(`${BASE_URL}/${wf1Id}/execute`, { method: 'POST' });
    if (!exec1Response.ok) {
        const text = await exec1Response.text();
        throw new Error(`Failed to execute workflow 1: ${exec1Response.status} ${text}`);
    }
    const exec1 = await exec1Response.json();
    if (!exec1.success) throw new Error(`Failed to execute workflow 1: ${JSON.stringify(exec1)}`);
    const run1Id = exec1.data.id;
    console.log(`Execution started: ${run1Id}`);

    // 3. Check Run 1 Details
    // Note: The /runs/:id route is mounted at /api/workflows/runs/:id because the router is at /api/workflows
    console.log(`Checking Run 1 Details at ${BASE_URL}/runs/${run1Id}...`);
    const run1Response = await fetch(`${BASE_URL}/runs/${run1Id}`);
    if (!run1Response.ok) {
        const text = await run1Response.text();
        console.error(`Failed to fetch run details: ${text}`);
    } else {
        const run1 = await run1Response.json();
        console.log('Run 1 Status:', run1.data.status);
        console.log('Run 1 Logs:', JSON.stringify(run1.data.execution_logs, null, 2));
        console.log('Run 1 Results:', JSON.stringify(run1.data.step_results, null, 2));
    }

    // 4. Create Validation Workflow
    console.log('\n2. Creating Validation Workflow...');
    const wf2Response = await fetch(`${BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: "Validation Test",
            trigger_type: "manual",
            trigger_config: {},
            steps: [
                {
                    id: "step-1",
                    type: "validate",
                    order: 1,
                    config: {
                        data: {
                            email: "test@example.com",
                            name: "John Doe"
                        },
                        rules: [
                            { field: "email", type: "required" },
                            { field: "email", type: "email" },
                            { field: "name", type: "min_length", value: 3 }
                        ]
                    }
                },
                {
                    id: "step-2",
                    type: "log",
                    order: 2,
                    config: {
                        message: "Validation passed!"
                    }
                }
            ]
        })
    });

    const wf2 = await wf2Response.json();
    if (!wf2.success) throw new Error(`Failed to create workflow 2: ${JSON.stringify(wf2)}`);
    const wf2Id = wf2.data.id;
    console.log(`Workflow 2 Created: ${wf2Id}`);

    // 5. Execute Workflow 2
    console.log('Executing Workflow 2...');
    const exec2Response = await fetch(`${BASE_URL}/${wf2Id}/execute`, { method: 'POST' });
    const exec2 = await exec2Response.json();
    if (!exec2.success) throw new Error(`Failed to execute workflow 2: ${JSON.stringify(exec2)}`);
    const run2Id = exec2.data.id;
    console.log(`Execution started: ${run2Id}`);

    // 6. Check Run 2 Details
    console.log('Checking Run 2 Details...');
    const run2Response = await fetch(`${BASE_URL}/runs/${run2Id}`);
    const run2 = await run2Response.json();
    console.log('Run 2 Status:', run2.data.status);
    console.log('Run 2 Logs:', JSON.stringify(run2.data.execution_logs, null, 2));
}

runTests().catch(console.error);
