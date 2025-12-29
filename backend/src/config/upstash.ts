import { Redis } from '@upstash/redis';
import 'dotenv/config';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL as string,
    token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

// Cache Service with helper functions
export const cacheService = {

    // get value from cache
    async getCache<T>(key: string): Promise<T | null> {
        try {
            const data = await redis.get(key);
            console.log("Key retrieved!: ", key)
            return data as T;
        } catch (error) {
            console.error("Redis GET Error (getCache): ", error);
            return null;
        }
    },

    // set value to cache with optional expiration time in seconds
    async setCache(key: string, value: any, expirationInSeconds?: number): Promise<void> {
        try {
            if (expirationInSeconds) {
                await redis.setex(key, expirationInSeconds, JSON.stringify(value));
            } else {
                await redis.set(key, JSON.stringify(value));
            }
            console.log(`Cached: ${key} (Expires In: ${expirationInSeconds || 'none'}s)`);
        } catch (error) {
            console.error("Redis SET Error (setCache): ", error);
        }
    }
};

export default redis;