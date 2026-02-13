import { pool } from '../../config/database';
import { UserSession } from '../../types/user.types';

export class SessionRepository {
    async create(userId: string, refreshToken: string, expiresAt: Date): Promise<UserSession> {
        const query = `
      INSERT INTO sessions (user_id, refresh_token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
        const result = await pool.query(query, [userId, refreshToken, expiresAt]);
        return result.rows[0];
    }

    async findByToken(refreshToken: string): Promise<UserSession | null> {
        const query = 'SELECT * FROM sessions WHERE refresh_token = $1 AND expires_at > NOW()';
        const result = await pool.query(query, [refreshToken]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async delete(refreshToken: string): Promise<void> {
        const query = 'DELETE FROM sessions WHERE refresh_token = $1';
        await pool.query(query, [refreshToken]);
    }

    async deleteExpired(): Promise<void> {
        const query = 'DELETE FROM sessions WHERE expires_at <= NOW()';
        await pool.query(query);
    }

    async deleteUserSessions(userId: string): Promise<void> {
        const query = 'DELETE FROM sessions WHERE user_id = $1';
        await pool.query(query, [userId]);
    }
}
