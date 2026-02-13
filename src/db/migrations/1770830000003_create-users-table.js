exports.up = (pgm) => {
    pgm.createTable('users', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        email: {
            type: 'varchar(255)',
            notNull: true,
            unique: true,
        },
        password_hash: {
            type: 'text',
            notNull: true,
        },
        name: {
            type: 'varchar(255)',
        },
        is_verified: {
            type: 'boolean',
            notNull: true,
            default: false,
        },
        verification_token: {
            type: 'text',
        },
        verification_token_expiry: {
            type: 'timestamp',
        },
        reset_token: {
            type: 'text',
        },
        reset_token_expiry: {
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
        last_login_at: {
            type: 'timestamp',
        },
    });

    pgm.createIndex('users', 'email');
};

exports.down = (pgm) => {
    pgm.dropTable('users');
};
