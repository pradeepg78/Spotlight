import { Redis } from '@upstash/redis';
import 'dotenv/config';

/**
 * Two-tier cache.
 *
 * Upstash Redis is used when UPSTASH_REDIS_REST_URL/TOKEN are configured and
 * reachable; otherwise the service transparently falls back to an in-process
 * TTL cache. The fallback means a fresh clone caches correctly with no external
 * setup, and a Redis outage degrades to local caching instead of disabling it.
 */

interface MemoryEntry {
    value: unknown;
    expiresAt: number | null; // epoch ms, null = no expiry
}

class MemoryCache {
    private store = new Map<string, MemoryEntry>();

    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value as T;
    }

    set(key: string, value: unknown, ttlSeconds?: number): void {
        this.store.set(key, {
            value,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
        });
    }

    delete(key: string): void {
        this.store.delete(key);
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    clear(): void {
        this.store.clear();
    }

    /** Drop expired entries so an idle server does not hold dead payloads. */
    prune(): number {
        const now = Date.now();
        let removed = 0;
        for (const [key, entry] of this.store) {
            if (entry.expiresAt !== null && now > entry.expiresAt) {
                this.store.delete(key);
                removed++;
            }
        }
        return removed;
    }

    get size(): number {
        return this.store.size;
    }
}

const memoryCache = new MemoryCache();

// Sweep expired keys every 5 minutes; unref so it never holds the process open.
setInterval(() => memoryCache.prune(), 5 * 60 * 1000).unref();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
    redisUrl && redisToken
        ? new Redis({ url: redisUrl, token: redisToken })
        : null;

/**
 * Flips to true after Redis fails once, so we stop paying a network timeout on
 * every request when the instance is gone (expired free tier, bad creds, DNS).
 */
let redisDisabled = false;

function useRedis(): boolean {
    return redis !== null && !redisDisabled;
}

function disableRedis(operation: string, error: unknown): void {
    if (redisDisabled) return;
    redisDisabled = true;
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
        `[cache] Redis ${operation} failed (${reason}) - falling back to in-memory cache for the rest of this process.`,
    );
}

// Simple counters so cache effectiveness is measurable rather than assumed.
const stats = { hits: 0, misses: 0 };

export const cacheService = {
    async getCache<T>(key: string): Promise<T | null> {
        if (useRedis()) {
            try {
                const data = await redis!.get<T>(key);
                if (data !== null && data !== undefined) {
                    stats.hits++;
                    return data;
                }
                stats.misses++;
                return null;
            } catch (error) {
                disableRedis('GET', error);
            }
        }

        const data = memoryCache.get<T>(key);
        if (data !== null) {
            stats.hits++;
        } else {
            stats.misses++;
        }
        return data;
    },

    async setCache(key: string, value: any, expirationInSeconds?: number): Promise<void> {
        // Always populate memory so a later Redis failure still has a warm local copy.
        memoryCache.set(key, value, expirationInSeconds);

        if (useRedis()) {
            try {
                // Pass the object directly - the Upstash client handles
                // serialization. Pre-stringifying here would double-encode it.
                if (expirationInSeconds) {
                    await redis!.setex(key, expirationInSeconds, value);
                } else {
                    await redis!.set(key, value);
                }
            } catch (error) {
                disableRedis('SET', error);
            }
        }
    },

    async deleteKey(key: string): Promise<void> {
        memoryCache.delete(key);
        if (useRedis()) {
            try {
                await redis!.del(key);
            } catch (error) {
                disableRedis('DEL', error);
            }
        }
    },

    async existsKey(key: string): Promise<boolean> {
        if (useRedis()) {
            try {
                return (await redis!.exists(key)) === 1;
            } catch (error) {
                disableRedis('EXISTS', error);
            }
        }
        return memoryCache.has(key);
    },

    async clearCache(): Promise<void> {
        memoryCache.clear();
        if (useRedis()) {
            try {
                await redis!.flushdb();
            } catch (error) {
                disableRedis('FLUSHDB', error);
            }
        }
    },

    async getStats(): Promise<{
        backend: 'redis' | 'memory';
        keys: number;
        hits: number;
        misses: number;
        hitRate: string;
    }> {
        const total = stats.hits + stats.misses;
        const base = {
            hits: stats.hits,
            misses: stats.misses,
            hitRate: total === 0 ? 'n/a' : `${((stats.hits / total) * 100).toFixed(1)}%`,
        };

        if (useRedis()) {
            try {
                return { backend: 'redis', keys: await redis!.dbsize(), ...base };
            } catch (error) {
                disableRedis('DBSIZE', error);
            }
        }
        return { backend: 'memory', keys: memoryCache.size, ...base };
    },

    /** Which backend is actually serving requests right now. */
    activeBackend(): 'redis' | 'memory' {
        return useRedis() ? 'redis' : 'memory';
    },
};

export default cacheService;
