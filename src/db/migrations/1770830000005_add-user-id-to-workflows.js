exports.up = (pgm) => {
    // Add user_id column to workflows (allow null temporarily)
    pgm.addColumn('workflows', {
        user_id: {
            type: 'uuid',
            notNull: false,
        },
    });

    // Add foreign key constraint
    pgm.addConstraint('workflows', 'workflows_user_id_fkey', {
        foreignKeys: {
            columns: 'user_id',
            references: 'users(id)',
            onDelete: 'CASCADE',
        },
    });

    // Create index for faster queries
    pgm.createIndex('workflows', 'user_id');
};

exports.down = (pgm) => {
    pgm.dropConstraint('workflows', 'workflows_user_id_fkey');
    pgm.dropColumn('workflows', 'user_id');
};
