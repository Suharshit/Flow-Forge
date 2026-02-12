import { pool } from '../../config/database';
import { UserCredential, CreateCredentialDTO, ServiceType } from '../../types/credentials.types';
import { encrypt, decrypt } from '../../utils/encryption';

export class CredentialsRepository {
    async create(data: CreateCredentialDTO): Promise<UserCredential> {
        const query = `
      INSERT INTO user_credentials (user_id, service, access_token, refresh_token, token_expiry)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, service) 
      DO UPDATE SET 
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expiry = EXCLUDED.token_expiry,
        updated_at = current_timestamp
      RETURNING *
    `;

        const encryptedAccessToken = encrypt(data.access_token);
        const encryptedRefreshToken = data.refresh_token ? encrypt(data.refresh_token) : null;

        const values = [
            data.user_id,
            data.service,
            encryptedAccessToken,
            encryptedRefreshToken,
            data.token_expiry || null,
        ];

        const result = await pool.query(query, values);
        return this.mapRowToCredential(result.rows[0]);
    }

    async findByUserAndService(userId: string, service: ServiceType): Promise<UserCredential | null> {
        const query = 'SELECT * FROM user_credentials WHERE user_id = $1 AND service = $2';
        const result = await pool.query(query, [userId, service]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRowToCredential(result.rows[0]);
    }

    async update(
        userId: string,
        service: ServiceType,
        data: { access_token?: string; refresh_token?: string; token_expiry?: Date }
    ): Promise<void> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.access_token) {
            fields.push(`access_token = $${paramCount++}`);
            values.push(encrypt(data.access_token));
        }

        if (data.refresh_token) {
            fields.push(`refresh_token = $${paramCount++}`);
            values.push(encrypt(data.refresh_token));
        }

        if (data.token_expiry) {
            fields.push(`token_expiry = $${paramCount++}`);
            values.push(data.token_expiry);
        }

        fields.push(`updated_at = current_timestamp`);
        values.push(userId, service);

        const query = `
      UPDATE user_credentials
      SET ${fields.join(', ')}
      WHERE user_id = $${paramCount} AND service = $${paramCount + 1}
    `;

        await pool.query(query, values);
    }

    async delete(userId: string, service: ServiceType): Promise<boolean> {
        const query = 'DELETE FROM user_credentials WHERE user_id = $1 AND service = $2';
        const result = await pool.query(query, [userId, service]);
        return result.rowCount !== null && result.rowCount > 0;
    }

    private mapRowToCredential(row: any): UserCredential {
        return {
            id: row.id,
            user_id: row.user_id,
            service: row.service,
            access_token: decrypt(row.access_token),
            refresh_token: row.refresh_token ? decrypt(row.refresh_token) : undefined,
            token_expiry: row.token_expiry,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
}
