// tests is excluded in tsconfig to prepare for deployment (tests will be excluded from the actual deployed pp)
// so add this line to fix the process types issue
/// <reference types="node" /> 
import { cacheService } from '../src/config/upstash';

async function testUpstashCache() {
    console.log("Testing Upstash Redis Cache...");

    try {
        // Test 1: Set cache value
        console.log("Test 1: Setting cache value...");
        await cacheService.setCache("test-key", {message: 'Hello from Upstash!'}, 60);

        // Test 2: Get the value
        console.log("Test 2: Getting cache value...");
        const data = await cacheService.getCache<{message: string}>("test-key");
        if (data && data.message === 'Hello from Upstash!') {
            console.log('Cache GET successful: ', data);
        } else {
            throw new Error('Failed to get correct data');
        }

        // Test 3: Check key exists
        console.log("Test 3: Checking if key exists...");
        const exists = await cacheService.existsKey("test-key");
        console.log('Key exists: ', exists);

        // Test 4: Delete key
        console.log("Test 4: Deleting cache key...");
        await cacheService.deleteKey("test-key");

        //! check test 5 again
        // Test 5: Verify key deletion
        console.log("Test 5: Verifying deletion...");
        const existsAfterDel = await cacheService.existsKey("test-key");
        if (!existsAfterDel) {
            console.log('Key successfully deleted');
        }

        // Test 6: Test expiration of key
        console.log("Test 6: Testing expiration (5 seconds)...");
        await cacheService.setCache('test-expire', {temp: 'dummy-data'}, 5);
        console.log('Waiting 6 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 6000));
        const expiredData = await cacheService.getCache('test-expire');
        if (expiredData === null) {
            console.log('Expiration success!');
        }

        // Test 7: Cache statistics
        console.log("Test 7: Getting cache stats...");
        const stats = await cacheService.getStats();
        console.log('Cache stats: ', stats);

        console.log('All Upstash Cache tests PASSED!');
        process.exit(0);

    } catch (error) {
        console.error('\nUpstash cache test FAILED: ', error);
        process.exit(1);
    }
}

testUpstashCache();