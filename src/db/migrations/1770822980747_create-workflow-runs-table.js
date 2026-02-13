exports.up = (pgm) => {
    pgm.createTable('workflow_runs', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        workflow_id: {
            type: 'uuid',
            notNull: true,
            references: 'workflows(id)',
            onDelete: 'CASCADE',
        },
        status: {
            type: 'varchar(50)',
            notNull: true,
            check: "status IN ('pending', 'running', 'completed', 'failed')",
            default: "'pending'",
        },
        started_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        completed_at: {
            type: 'timestamp',
        },
        error_message: {
            type: 'text',
        },
        execution_logs: {
            type: 'jsonb',
            default: '[]',
        },
        step_results: {
            type: 'jsonb',
            default: '{}',
        },
    });

    pgm.createIndex('workflow_runs', 'workflow_id');
    pgm.createIndex('workflow_runs', 'status');
};

exports.down = (pgm) => {
    pgm.dropTable('workflow_runs');
};
