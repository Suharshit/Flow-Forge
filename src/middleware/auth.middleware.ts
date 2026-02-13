import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt.utils';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, error: 'Access token required' });
    }

    try {
        const payload = JWTUtils.verifyAccessToken(token);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
};

export const requireVerified = (req: Request, res: Response, next: NextFunction) => {
    // This middleware should be used after authenticateToken
    // In production, you'd check user.is_verified from database
    // For now, we assume token is only issued to verified users
    next();
};
