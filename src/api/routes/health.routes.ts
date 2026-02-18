import { Router, Request, Response } from 'express';
import { pool } from '../../config/database';
import { redis } from '../../config/redis';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    const healthCheck = {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        checks: {
            database: 'unknown',
            redis: 'unknown'
        }
    };

    try {
        // Check Database
        await pool.query('SELECT 1');
        healthCheck.checks.database = 'ok';
    } catch (error) {
        healthCheck.checks.database = 'error';
        console.error('Health Check - Database Error:', error);
    }

    try {
        // Check Redis
        const ping = await redis.ping();
        if (ping === 'PONG') {
            healthCheck.checks.redis = 'ok';
        } else {
            healthCheck.checks.redis = 'error';
        }
    } catch (error) {
        healthCheck.checks.redis = 'error';
        console.error('Health Check - Redis Error:', error);
    }

    const isHealthy =
        healthCheck.checks.database === 'ok' &&
        healthCheck.checks.redis === 'ok';

    // Using 503 Service Unavailable if any dependency is down, otherwise 200 OK
    const httpStatus = isHealthy ? 200 : 503;

    res.status(httpStatus).json({
        status: isHealthy ? 'ok' : 'degraded',
        ...healthCheck
    });
});

export default router;
