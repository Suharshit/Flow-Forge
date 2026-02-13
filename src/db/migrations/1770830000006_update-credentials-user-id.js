exports.up = (pgm) => {
  // Drop NOT NULL constraint so we can clear invalid values
  pgm.sql(`
    ALTER TABLE user_credentials 
    ALTER COLUMN user_id DROP NOT NULL
  `);

  // Clear non-UUID user_id values before type cast
  pgm.sql(`
    UPDATE user_credentials 
    SET user_id = NULL 
    WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  `);

  // Change user_id from varchar to uuid
  pgm.sql(`
    ALTER TABLE user_credentials 
    ALTER COLUMN user_id TYPE uuid USING user_id::uuid
  `);

  // Add foreign key constraint
  pgm.addConstraint('user_credentials', 'user_credentials_user_id_fkey', {
    foreignKeys: {
      columns: 'user_id',
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('user_credentials', 'user_credentials_user_id_fkey');

  pgm.sql(`
    ALTER TABLE user_credentials 
    ALTER COLUMN user_id TYPE varchar(255)
  `);

  pgm.sql(`
    ALTER TABLE user_credentials 
    ALTER COLUMN user_id SET NOT NULL
  `);
};
