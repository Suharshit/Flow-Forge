exports.up = (pgm) => {
    pgm.createTable('user_credentials', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        user_id: {
            type: 'varchar(255)',
            notNull: true,
        },
        service: {
            type: 'varchar(50)',
            notNull: true,
            check: "service IN ('gmail', 'notion', 'slack')",
        },
        access_token: {
            type: 'text',
            notNull: true,
        },
        refresh_token: {
            type: 'text',
        },
        token_expiry: {
            type: 'timestamp',
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

    // Unique constraint: one credential per user per service
    pgm.createIndex('user_credentials', ['user_id', 'service'], { unique: true });
};

exports.down = (pgm) => {
    pgm.dropTable('user_credentials');
};
