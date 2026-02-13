exports.up = (pgm) => {
    pgm.createTable('workflows', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        name: {
            type: 'varchar(255)',
            notNull: true,
        },
        description: {
            type: 'text',
        },
        trigger_type: {
            type: 'varchar(50)',
            notNull: true,
            check: "trigger_type IN ('scheduled', 'webhook', 'manual')",
        },
        trigger_config: {
            type: 'jsonb',
            notNull: true,
            default: '{}',
        },
        steps: {
            type: 'jsonb',
            notNull: true,
            default: '[]',
        },
        is_active: {
            type: 'boolean',
            notNull: true,
            default: true,
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    pgm.createIndex('workflows', 'is_active');
};

exports.down = (pgm) => {
    pgm.dropTable('workflows');
};
