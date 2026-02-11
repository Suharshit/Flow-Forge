import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
}

// Create Redis connection
export const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

redis.on('connect', () => {
    console.log('✅ Redis connected');
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

export const closeRedis = async (): Promise<void> => {
    await redis.quit();
    console.log('Redis connection closed');
};
