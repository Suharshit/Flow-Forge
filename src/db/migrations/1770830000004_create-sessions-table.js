exports.up = (pgm) => {
    pgm.createTable('sessions', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        user_id: {
            type: 'uuid',
            notNull: true,
            references: 'users(id)',
            onDelete: 'CASCADE',
        },
        refresh_token: {
            type: 'text',
            notNull: true,
            unique: true,
        },
        expires_at: {
            type: 'timestamp',
            notNull: true,
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    pgm.createIndex('sessions', 'user_id');
    pgm.createIndex('sessions', 'refresh_token');
};

exports.down = (pgm) => {
    pgm.dropTable('sessions');
};
