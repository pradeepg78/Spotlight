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
    },

    // delete key from cache
    async deleteKey(key: string): Promise<void> {
        try {
            await redis.del(key);
            console.log("Key deleted: ", key);
        } catch (error) {
            console.error("Redis DEL Error (deleteKey): ", error);
        }
    },

    // check if a key exists
    async existsKey(key: string): Promise<boolean> {
        try {
            const result = await redis.exists(key);
            console.log(`Key ${key} successfully found!`);
            return result === 1;
        } catch (error) {
            console.error("Redis EXISTS Error (existsKey): ", error);
            return false;
        }
    },

    // clear entire cache
    async clearCache(): Promise<void> {
        try {
            await redis.flushdb();
            console.log("Redis cache successfully cleared!");
        } catch (error) {
            console.error("Redis FLUSH Error (clearCache): ", error);
        }
    }, 

    // get cache statistics
    async getStats(): Promise<any> {
        try {
            const info = await redis.dbsize();
            return {keys : info};
        } catch (error) {
            console.error("Redis STATS Error (getStats): ", error);
            return null;
        }
    }
};

export default redis;