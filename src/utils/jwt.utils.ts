import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload, AuthTokens } from '../types/user.types';

export class JWTUtils {
    static generateAccessToken(userId: string, email: string): string {
        const payload: JWTPayload = { userId, email };

        return jwt.sign(payload, process.env.JWT_SECRET!, {
            expiresIn: (process.env.JWT_EXPIRY || '1h') as any,
        });
    }

    static generateRefreshToken(userId: string): string {
        return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
            expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any,
        });
    }

    static generateTokens(userId: string, email: string): AuthTokens {
        return {
            accessToken: this.generateAccessToken(userId, email),
            refreshToken: this.generateRefreshToken(userId),
        };
    }

    static verifyAccessToken(token: string): JWTPayload {
        return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    }

    static verifyRefreshToken(token: string): { userId: string } {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    }

    static getRefreshTokenExpiry(): Date {
        const expiryDays = parseInt(process.env.JWT_REFRESH_EXPIRY?.replace('d', '') || '7');
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + expiryDays);
        return expiry;
    }
}
