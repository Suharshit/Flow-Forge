
require('dotenv').config();
const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL;
console.log('Testing Redis connection...');
// Mask password in logs
console.log('URL:', redisUrl ? redisUrl.replace(/:([^:@]+)@/, ':****@') : 'undefined');

if (!redisUrl) {
    console.error('❌ REDIS_URL is not defined in .env');
    process.exit(1);
}

const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
        if (times > 3) {
            return null; // Stop retrying
        }
        return 1000;
    }
});

redis.on('connect', () => {
    console.log('✅ Connected to Redis successfully!');
    redis.quit();
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
    redis.quit();
    process.exit(1);
});
