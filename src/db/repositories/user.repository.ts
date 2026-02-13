import { pool } from '../../config/database';
import { User, CreateUserDTO, UpdateUserDTO } from '../../types/user.types';

export class UserRepository {
    async create(data: CreateUserDTO & { password_hash: string }): Promise<User> {
        const query = `
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

        const values = [data.email, data.password_hash, data.name || null];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async findById(id: string): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async update(id: string, data: UpdateUserDTO): Promise<User | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(data.name);
        }

        if (data.email !== undefined) {
            fields.push(`email = $${paramCount++}`);
            values.push(data.email);
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        fields.push(`updated_at = current_timestamp`);
        values.push(id);

        const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

        const result = await pool.query(query, values);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async updatePassword(id: string, password_hash: string): Promise<void> {
        const query = `
      UPDATE users
      SET password_hash = $1, updated_at = current_timestamp
      WHERE id = $2
    `;
        await pool.query(query, [password_hash, id]);
    }

    async setVerificationToken(id: string, token: string, expiry: Date): Promise<void> {
        const query = `
      UPDATE users
      SET verification_token = $1, verification_token_expiry = $2
      WHERE id = $3
    `;
        await pool.query(query, [token, expiry, id]);
    }

    async verifyEmail(token: string): Promise<User | null> {
        const query = `
      UPDATE users
      SET is_verified = true, verification_token = null, verification_token_expiry = null
      WHERE verification_token = $1 AND verification_token_expiry > NOW()
      RETURNING *
    `;
        const result = await pool.query(query, [token]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async setResetToken(email: string, token: string, expiry: Date): Promise<void> {
        const query = `
      UPDATE users
      SET reset_token = $1, reset_token_expiry = $2
      WHERE email = $3
    `;
        await pool.query(query, [token, expiry, email]);
    }

    async resetPassword(token: string, password_hash: string): Promise<User | null> {
        const query = `
      UPDATE users
      SET password_hash = $1, reset_token = null, reset_token_expiry = null
      WHERE reset_token = $2 AND reset_token_expiry > NOW()
      RETURNING *
    `;
        const result = await pool.query(query, [password_hash, token]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async updateLastLogin(id: string): Promise<void> {
        const query = 'UPDATE users SET last_login_at = current_timestamp WHERE id = $1';
        await pool.query(query, [id]);
    }

    async delete(id: string): Promise<boolean> {
        const query = 'DELETE FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rowCount !== null && result.rowCount > 0;
    }
}
