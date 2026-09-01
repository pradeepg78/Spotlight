// tests/ is excluded from tsconfig (so it stays out of the deployed build),
// which is why the node types are referenced explicitly here.
/// <reference types="node" />
import { cacheService } from '../src/config/cache';

async function testCache() {
    console.log(`Testing cache service (active backend: ${cacheService.activeBackend()})...\n`);

    try {
        console.log('Test 1: set a value');
        await cacheService.setCache('test-key', { message: 'Hello from Spotlight!' }, 60);

        console.log('Test 2: read it back');
        const data = await cacheService.getCache<{ message: string }>('test-key');
        if (data?.message !== 'Hello from Spotlight!') {
            throw new Error(`expected the stored object back, got: ${JSON.stringify(data)}`);
        }
        console.log('  ->', data);

        console.log('Test 3: key exists');
        if (!(await cacheService.existsKey('test-key'))) {
            throw new Error('existsKey returned false for a key that was just set');
        }

        console.log('Test 4: delete the key');
        await cacheService.deleteKey('test-key');
        if (await cacheService.existsKey('test-key')) {
            throw new Error('key still present after delete');
        }

        console.log('Test 5: TTL expiry (2s)');
        await cacheService.setCache('test-expire', { temp: 'dummy-data' }, 2);
        await new Promise((resolve) => setTimeout(resolve, 2500));
        if ((await cacheService.getCache('test-expire')) !== null) {
            throw new Error('key survived past its TTL');
        }

        console.log('Test 6: object round-trips without double-encoding');
        const nested = { events: [{ id: 'abc', venue: { lat: 42.28, lng: -83.74 } }] };
        await cacheService.setCache('test-nested', nested, 60);
        const back = await cacheService.getCache<typeof nested>('test-nested');
        if (back?.events?.[0]?.venue?.lat !== 42.28) {
            throw new Error(`nested object came back malformed: ${JSON.stringify(back)}`);
        }
        await cacheService.deleteKey('test-nested');

        console.log('\nStats:', await cacheService.getStats());
        console.log('\nAll cache tests PASSED');
        process.exit(0);
    } catch (error) {
        console.error('\nCache test FAILED:', error);
        process.exit(1);
    }
}

testCache();
